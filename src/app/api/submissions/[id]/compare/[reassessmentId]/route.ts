import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/errors/messages';
import {
  DisputeResolutionItemSchema,
  UuidParamSchema,
  type DisputeEventRow,
  type DisputeResolutionItem,
  type GapWithId,
  type SubmissionDetail,
} from '@/lib/validation/schemas';
import { deriveStatus } from '@/lib/scoring/calculator';
import { pillarFromElementCode, type Pillar } from '@/lib/agents/scopedReassessment';
import { z } from 'zod';

const AgentOutputsBlobSchema = z.object({
  cs: z.object({ dispute_resolutions: z.array(DisputeResolutionItemSchema).optional() }).passthrough(),
  oa: z.object({ dispute_resolutions: z.array(DisputeResolutionItemSchema).optional() }).passthrough(),
  om: z.object({ dispute_resolutions: z.array(DisputeResolutionItemSchema).optional() }).passthrough(),
});

function pillarKey(pillar: Pillar): 'cs' | 'oa' | 'om' {
  if (pillar === 'conceptual_soundness') return 'cs';
  if (pillar === 'outcomes_analysis') return 'oa';
  return 'om';
}

interface RawSubmissionRow {
  id: string;
  user_id: string;
  version_number: number;
  document_text: string;
  conceptual_score: number | string;
  outcomes_score: number | string;
  monitoring_score: number | string;
  final_score: number | string;
  judge_confidence: number | string;
  assessment_confidence_label: SubmissionDetail['assessment_confidence_label'];
  created_at: string;
  parent_assessment_id: string | null;
  low_confidence_manual_review: boolean;
  models: { model_name: string } | null;
}

const SUBMISSION_SELECT =
  'id, user_id, version_number, document_text, conceptual_score, outcomes_score, monitoring_score, final_score, judge_confidence, assessment_confidence_label, created_at, parent_assessment_id, low_confidence_manual_review, models(model_name)';

function rowToDetail(row: RawSubmissionRow, gaps: GapWithId[]): SubmissionDetail {
  const finalScore = Number(row.final_score);
  return {
    id: row.id,
    model_name: row.models?.model_name ?? 'Unknown',
    version_number: row.version_number,
    conceptual_score: Number(row.conceptual_score),
    outcomes_score: Number(row.outcomes_score),
    monitoring_score: Number(row.monitoring_score),
    final_score: finalScore,
    status: deriveStatus(finalScore),
    assessment_confidence_label: row.assessment_confidence_label,
    created_at: row.created_at,
    document_text: row.document_text,
    gap_analysis: gaps,
    judge_confidence: Number(row.judge_confidence),
  };
}

function gapKey(elementCode: string): string {
  return elementCode;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; reassessmentId: string }> }
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

  const { id, reassessmentId } = await params;
  const idParse = UuidParamSchema.safeParse({ id });
  const reIdParse = UuidParamSchema.safeParse({ id: reassessmentId });
  if (!idParse.success || !reIdParse.success) {
    return errorResponse('VALIDATION_ERROR', { message: 'Invalid submission ID.' });
  }

  try {
    // Fetch both submissions in parallel
    const [{ data: parentRowRaw, error: parentErr }, { data: reRowRaw, error: reErr }] =
      await Promise.all([
        supabase.from('submissions').select(SUBMISSION_SELECT).eq('id', id).maybeSingle(),
        supabase
          .from('submissions')
          .select(SUBMISSION_SELECT)
          .eq('id', reassessmentId)
          .maybeSingle(),
      ]);

    if (parentErr || reErr) {
      Sentry.captureException(parentErr ?? reErr);
      return errorResponse('DATABASE_ERROR');
    }

    const parentRow = parentRowRaw as unknown as RawSubmissionRow | null;
    const reRow = reRowRaw as unknown as RawSubmissionRow | null;

    if (!parentRow || parentRow.user_id !== user.id) {
      return errorResponse('SUBMISSION_NOT_FOUND');
    }
    if (!reRow || reRow.user_id !== user.id) {
      return errorResponse('SUBMISSION_NOT_FOUND');
    }
    if (reRow.parent_assessment_id !== parentRow.id) {
      return errorResponse('SUBMISSION_NOT_FOUND');
    }

    // Fetch gaps for both submissions in parallel
    const [{ data: parentGapsRaw, error: pgErr }, { data: reGapsRaw, error: rgErr }] =
      await Promise.all([
        supabase
          .from('gaps')
          .select('id, element_code, element_name, severity, description, recommendation')
          .eq('submission_id', parentRow.id),
        supabase
          .from('gaps')
          .select('id, element_code, element_name, severity, description, recommendation')
          .eq('submission_id', reRow.id),
      ]);

    if (pgErr || rgErr) {
      Sentry.captureException(pgErr ?? rgErr);
      return errorResponse('DATABASE_ERROR');
    }

    const parentGaps = (parentGapsRaw ?? []) as GapWithId[];
    const reGaps = (reGapsRaw ?? []) as GapWithId[];

    // Fetch dispute events that triggered THIS specific re-assessment.
    // Without a foreign key from dispute_events to the produced re-run, we scope
    // by time window: disputes filed after the previous re-assessment of this
    // parent (or after the parent itself if this is the first re-run) and at or
    // before this re-assessment's creation time.
    const { data: prevReRaw, error: prevReErr } = await supabase
      .from('submissions')
      .select('created_at')
      .eq('parent_assessment_id', parentRow.id)
      .lt('created_at', reRow.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prevReErr) {
      Sentry.captureException(prevReErr);
      return errorResponse('DATABASE_ERROR');
    }

    const lowerBound = (prevReRaw?.created_at as string | undefined) ?? parentRow.created_at;

    const { data: deRaw, error: deErr } = await supabase
      .from('dispute_events')
      .select(
        'id, assessment_id, gap_id, user_id, dispute_type, reviewer_rationale, proposed_resolution, created_at'
      )
      .eq('assessment_id', parentRow.id)
      .gt('created_at', lowerBound)
      .lte('created_at', reRow.created_at)
      .order('created_at', { ascending: true });

    if (deErr) {
      Sentry.captureException(deErr);
      return errorResponse('DATABASE_ERROR');
    }
    const disputeEvents = (deRaw ?? []) as DisputeEventRow[];

    // Compute pillar reassessed (from the dispute event if present, else infer
    // from the first changed pillar score)
    let pillarReassessed: 'conceptual_soundness' | 'outcomes_analysis' | 'ongoing_monitoring' =
      'conceptual_soundness';
    if (disputeEvents.length > 0) {
      const firstDispute = disputeEvents[0];
      const matchingGap = parentGaps.find((g) => g.id === firstDispute.gap_id);
      if (matchingGap) {
        pillarReassessed = pillarFromElementCode(matchingGap.element_code);
      }
    }

    // Compute pillar deltas (reassessment minus parent)
    const deltas = {
      conceptual_soundness:
        Number(reRow.conceptual_score) - Number(parentRow.conceptual_score),
      outcomes_analysis: Number(reRow.outcomes_score) - Number(parentRow.outcomes_score),
      ongoing_monitoring:
        Number(reRow.monitoring_score) - Number(parentRow.monitoring_score),
      final_score: Number(reRow.final_score) - Number(parentRow.final_score),
    };

    // Compute gap diff keyed by element_code
    const parentByCode = new Map<string, GapWithId>();
    parentGaps.forEach((g) => parentByCode.set(gapKey(g.element_code), g));
    const reByCode = new Map<string, GapWithId>();
    reGaps.forEach((g) => reByCode.set(gapKey(g.element_code), g));

    const removed: GapWithId[] = [];
    const added: GapWithId[] = [];
    const severityChanged: Array<{
      element_code: string;
      element_name: string;
      before: GapWithId['severity'];
      after: GapWithId['severity'];
    }> = [];

    parentByCode.forEach((parentGap, code) => {
      const reGap = reByCode.get(code);
      if (!reGap) {
        removed.push(parentGap);
      } else if (reGap.severity !== parentGap.severity) {
        severityChanged.push({
          element_code: parentGap.element_code,
          element_name: parentGap.element_name,
          before: parentGap.severity,
          after: reGap.severity,
        });
      }
    });
    reByCode.forEach((reGap, code) => {
      if (!parentByCode.has(code)) {
        added.push(reGap);
      }
    });

    // Fetch dispute_resolutions from the eval row that the disputes route
    // wrote when this re-assessment was created. evals is service-role only,
    // so use the service client. Ownership has already been verified above.
    let disputeResolutions: DisputeResolutionItem[] = [];
    {
      const serviceDb = createServiceClient();
      const { data: evalRow, error: evalErr } = await serviceDb
        .from('evals')
        .select('agent_outputs')
        .eq('submission_id', reRow.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (evalErr) {
        // Non-fatal — surface empty list and continue
        Sentry.captureException(evalErr);
      } else if (evalRow?.agent_outputs) {
        const parsed = AgentOutputsBlobSchema.safeParse(evalRow.agent_outputs);
        if (parsed.success) {
          const key = pillarKey(pillarReassessed);
          disputeResolutions = parsed.data[key].dispute_resolutions ?? [];
        }
      }
    }

    return NextResponse.json({
      parent: rowToDetail(parentRow, parentGaps),
      reassessment: {
        ...rowToDetail(reRow, reGaps),
        parent_assessment_id: reRow.parent_assessment_id!,
        low_confidence_manual_review: reRow.low_confidence_manual_review,
      },
      pillar_reassessed: pillarReassessed,
      pillar_score_deltas: deltas,
      gap_diff: {
        added,
        removed,
        severity_changed: severityChanged,
      },
      dispute_events: disputeEvents,
      dispute_resolutions: disputeResolutions,
    });
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('DATABASE_ERROR');
  }
}
