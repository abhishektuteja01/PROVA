import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/errors/messages';
import { UuidParamSchema } from '@/lib/validation/schemas';
import type { SubmissionDetail, GapWithId } from '@/lib/validation/schemas';
import { deriveStatus } from '@/lib/scoring/calculator';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let supabase;
  try {
    supabase = await createServerClient();
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('UNKNOWN_ERROR');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse('AUTH_REQUIRED');
  }

  // Validate UUID param
  const { id } = await params;
  const parsed = UuidParamSchema.safeParse({ id });
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', {
      message: parsed.error.issues[0]?.message ?? 'Invalid submission ID.',
    });
  }

  const submissionId = parsed.data.id;

  try {
    // Fetch submission with model name join
    const { data: row, error: fetchError } = await supabase
      .from('submissions')
      .select(
        'id, user_id, version_number, document_text, conceptual_score, outcomes_score, monitoring_score, final_score, judge_confidence, assessment_confidence_label, created_at, models(model_name)'
      )
      .eq('id', submissionId)
      .maybeSingle();

    if (fetchError) {
      Sentry.captureException(fetchError);
      return errorResponse('DATABASE_ERROR');
    }

    // Not found or wrong user (defense in depth — RLS handles it too)
    if (!row || row.user_id !== user.id) {
      return errorResponse('SUBMISSION_NOT_FOUND');
    }

    // Fetch gaps from normalized table
    const { data: gapRows, error: gapsError } = await supabase
      .from('gaps')
      .select('id, element_code, element_name, severity, description, recommendation')
      .eq('submission_id', submissionId);

    if (gapsError) {
      Sentry.captureException(gapsError);
      return errorResponse('DATABASE_ERROR');
    }

    const models = row.models as unknown as { model_name: string } | null;
    const finalScore = Number(row.final_score);

    const detail: SubmissionDetail = {
      id: row.id,
      model_name: models?.model_name ?? 'Unknown',
      version_number: row.version_number,
      conceptual_score: Number(row.conceptual_score),
      outcomes_score: Number(row.outcomes_score),
      monitoring_score: Number(row.monitoring_score),
      final_score: finalScore,
      status: deriveStatus(finalScore),
      assessment_confidence_label: row.assessment_confidence_label as SubmissionDetail['assessment_confidence_label'],
      created_at: row.created_at,
      document_text: row.document_text,
      gap_analysis: (gapRows ?? []) as GapWithId[],
      judge_confidence: Number(row.judge_confidence),
    };

    return NextResponse.json(detail);
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('DATABASE_ERROR');
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let supabase;
  try {
    supabase = await createServerClient();
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('UNKNOWN_ERROR');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse('AUTH_REQUIRED');
  }

  // Validate UUID param
  const { id } = await params;
  const parsed = UuidParamSchema.safeParse({ id });
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', {
      message: parsed.error.issues[0]?.message ?? 'Invalid submission ID.',
    });
  }

  const submissionId = parsed.data.id;

  try {
    // Verify existence and ownership (defense in depth)
    const { data: row, error: fetchError } = await supabase
      .from('submissions')
      .select('id, user_id')
      .eq('id', submissionId)
      .maybeSingle();

    if (fetchError) {
      Sentry.captureException(fetchError);
      return errorResponse('DATABASE_ERROR');
    }

    if (!row || row.user_id !== user.id) {
      return errorResponse('SUBMISSION_NOT_FOUND');
    }

    // Hard delete — FK CASCADE handles gaps and evals
    const { error: deleteError } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId);

    if (deleteError) {
      Sentry.captureException(deleteError);
      return errorResponse('DATABASE_ERROR');
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('DATABASE_ERROR');
  }
}
