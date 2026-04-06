import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/errors/messages';
import {
  PaginationParamsSchema,
  DeleteAllConfirmSchema,
} from '@/lib/validation/schemas';
import type { SubmissionListItem } from '@/lib/validation/schemas';
import { deriveStatus } from '@/lib/scoring/calculator';

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse('AUTH_REQUIRED');
  }

  // Parse and validate pagination params
  const { searchParams } = new URL(request.url);
  const parsed = PaginationParamsSchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', {
      message: parsed.error.issues[0]?.message ?? 'Invalid pagination parameters.',
    });
  }

  const { page, limit } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    // Count query for pagination metadata
    const { count, error: countError } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      Sentry.captureException(countError);
      return errorResponse('DATABASE_ERROR');
    }

    const total = count ?? 0;

    // Data query with model name join
    const { data: rows, error: dataError } = await supabase
      .from('submissions')
      .select(
        'id, version_number, conceptual_score, outcomes_score, monitoring_score, final_score, assessment_confidence_label, created_at, models(model_name)'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (dataError) {
      Sentry.captureException(dataError);
      return errorResponse('DATABASE_ERROR');
    }

    // Transform rows to match SubmissionListItemSchema
    const data: SubmissionListItem[] = (rows ?? []).map((row) => {
      const models = row.models as unknown as { model_name: string } | null;
      const finalScore = Number(row.final_score);

      return {
        id: row.id,
        model_name: models?.model_name ?? 'Unknown',
        version_number: row.version_number,
        conceptual_score: Number(row.conceptual_score),
        outcomes_score: Number(row.outcomes_score),
        monitoring_score: Number(row.monitoring_score),
        final_score: finalScore,
        status: deriveStatus(finalScore),
        assessment_confidence_label: row.assessment_confidence_label as SubmissionListItem['assessment_confidence_label'],
        created_at: row.created_at,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ data, page, limit, total, totalPages });
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('DATABASE_ERROR');
  }
}

export async function DELETE(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse('AUTH_REQUIRED');
  }

  // Require explicit confirmation
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', {
      message: 'Request body must be valid JSON.',
    });
  }

  const parsed = DeleteAllConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', {
      message: parsed.error.issues[0]?.message ?? 'Confirmation required.',
    });
  }

  try {
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      Sentry.captureException(error);
      return errorResponse('DATABASE_ERROR');
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('DATABASE_ERROR');
  }
}
