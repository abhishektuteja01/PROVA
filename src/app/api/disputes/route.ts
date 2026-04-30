import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/errors/messages';
import {
  DisputeRequestSchema,
  type DisputeRequest,
  type Gap,
  type AgentOutput,
} from '@/lib/validation/schemas';
import {
  pillarFromElementCode,
  runScopedReassessment,
  type Pillar,
} from '@/lib/agents/scopedReassessment';
import { calculateScores } from '@/lib/scoring/calculator';
import { AgentParseError, AgentSchemaError } from '@/lib/agents/errors';

function gapsForPillar(gaps: Gap[], pillar: Pillar): Gap[] {
  const prefix =
    pillar === 'conceptual_soundness'
      ? 'CS-'
      : pillar === 'outcomes_analysis'
        ? 'OA-'
        : 'OM-';
  return gaps.filter((g) => g.element_code.startsWith(prefix));
}

function buildPriorAgentOutput(
  pillar: Pillar,
  score: number,
  gaps: Gap[]
): AgentOutput {
  return {
    pillar,
    score,
    confidence: 0.8,
    gaps,
    summary:
      'Reused from prior assessment — this pillar was not re-run during the scoped re-assessment.',
  };
}

export async function POST(request: Request) {
  // 1. Verify session
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

  const userId = user.id;

  // 2. Validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', { message: 'Request body must be valid JSON.' });
  }

  const parsed = DisputeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', {
      message: parsed.error.issues[0]?.message ?? 'Invalid dispute request.',
    });
  }
  const dispute: DisputeRequest = parsed.data;

  // 3. Fetch parent submission and verify ownership (RLS also enforces this)
  const { data: parentSub, error: parentErr } = await supabase
    .from('submissions')
    .select(
      'id, user_id, model_id, version_number, document_text, conceptual_score, outcomes_score, monitoring_score, gap_analysis, models(model_name)'
    )
    .eq('id', dispute.assessment_id)
    .maybeSingle();

  if (parentErr) {
    Sentry.captureException(parentErr);
    return errorResponse('DATABASE_ERROR');
  }
  if (!parentSub || parentSub.user_id !== userId) {
    return errorResponse('SUBMISSION_NOT_FOUND');
  }

  // 4. Fetch the disputed gap row to determine pillar + verify it belongs here
  const { data: gapRow, error: gapErr } = await supabase
    .from('gaps')
    .select('id, submission_id, user_id, element_code, element_name, severity, description, recommendation, pillar')
    .eq('id', dispute.gap_id)
    .maybeSingle();

  if (gapErr) {
    Sentry.captureException(gapErr);
    return errorResponse('DATABASE_ERROR');
  }
  if (
    !gapRow ||
    gapRow.user_id !== userId ||
    gapRow.submission_id !== parentSub.id
  ) {
    return errorResponse('VALIDATION_ERROR', {
      message: 'Disputed gap does not belong to the referenced assessment.',
    });
  }

  const pillar = pillarFromElementCode(gapRow.element_code);

  // 5. Persist the dispute event (append-only trail) BEFORE re-running. If the
  // re-run fails we still keep the dispute filed for audit — the user can retry.
  const db = createServiceClient();

  const { data: disputeEvent, error: disputeErr } = await db
    .from('dispute_events')
    .insert({
      assessment_id: parentSub.id,
      gap_id: gapRow.id,
      user_id: userId,
      dispute_type: dispute.dispute_type,
      reviewer_rationale: dispute.reviewer_rationale,
      proposed_resolution: dispute.proposed_resolution ?? null,
    })
    .select('id, created_at')
    .single();

  if (disputeErr || !disputeEvent) {
    Sentry.captureException(disputeErr ?? new Error('Failed to insert dispute event'));
    return errorResponse('DATABASE_ERROR');
  }

  // 6. Build prior pillar outputs from the stored gap_analysis. The two
  // un-disputed pillars are reused unchanged; the disputed pillar is re-run.
  const allPriorGaps = (parentSub.gap_analysis ?? []) as Gap[];
  const csGaps = gapsForPillar(allPriorGaps, 'conceptual_soundness');
  const oaGaps = gapsForPillar(allPriorGaps, 'outcomes_analysis');
  const omGaps = gapsForPillar(allPriorGaps, 'ongoing_monitoring');

  const priorCs = buildPriorAgentOutput(
    'conceptual_soundness',
    Number(parentSub.conceptual_score),
    csGaps
  );
  const priorOa = buildPriorAgentOutput(
    'outcomes_analysis',
    Number(parentSub.outcomes_score),
    oaGaps
  );
  const priorOm = buildPriorAgentOutput(
    'ongoing_monitoring',
    Number(parentSub.monitoring_score),
    omGaps
  );

  const modelsRel = parentSub.models as unknown as { model_name: string } | null;
  const modelName = modelsRel?.model_name ?? 'Unknown';

  // 7. Run scoped re-assessment (single pillar agent + judge, threshold 0.7)
  let result;
  try {
    result = await runScopedReassessment({
      documentText: parentSub.document_text,
      modelName,
      pillar,
      previousCsOutput: priorCs,
      previousOaOutput: priorOa,
      previousOmOutput: priorOm,
      disputes: [
        {
          element_code: gapRow.element_code,
          dispute_type: dispute.dispute_type,
          reviewer_rationale: dispute.reviewer_rationale,
          proposed_resolution: dispute.proposed_resolution,
        },
      ],
    });
  } catch (err) {
    if (err instanceof AgentParseError || err instanceof AgentSchemaError) {
      Sentry.captureException(err);
      return errorResponse('AI_SCHEMA_INVALID');
    }
    Sentry.captureException(err);
    return errorResponse('AI_UNAVAILABLE');
  }

  // 8. Recalculate scores using the canonical formula
  const scoring = calculateScores(result.csOutput, result.oaOutput, result.omOutput);

  // 9. Persist the new submission row, linked via parent_assessment_id.
  // Re-assessments share their parent's version_number (the partial unique index
  // added in the migration only enforces uniqueness for parent_assessment_id IS NULL).
  const newAllGaps: Gap[] = [
    ...result.csOutput.gaps,
    ...result.oaOutput.gaps,
    ...result.omOutput.gaps,
  ];

  const { data: newSub, error: insertErr } = await db
    .from('submissions')
    .insert({
      model_id: parentSub.model_id,
      user_id: userId,
      version_number: parentSub.version_number,
      parent_assessment_id: parentSub.id,
      document_text: parentSub.document_text,
      conceptual_score: scoring.pillar_scores.conceptual_soundness,
      outcomes_score: scoring.pillar_scores.outcomes_analysis,
      monitoring_score: scoring.pillar_scores.ongoing_monitoring,
      final_score: scoring.final_score,
      gap_analysis: newAllGaps,
      judge_confidence: result.judgeOutput.confidence,
      assessment_confidence_label: result.judgeOutput.confidence_label,
      retry_count: result.retryCount,
      low_confidence_manual_review: result.lowConfidenceManualReview,
    })
    .select('id, created_at')
    .single();

  if (insertErr || !newSub) {
    Sentry.captureException(insertErr ?? new Error('Failed to insert reassessment submission'));
    return errorResponse('DATABASE_ERROR');
  }

  const reassessmentId = String((newSub as { id: string }).id);

  // 10. Persist gaps for the new submission row
  const newGapRows = [
    ...result.csOutput.gaps.map((g) => ({
      submission_id: reassessmentId,
      user_id: userId,
      pillar: 'conceptual_soundness' as const,
      element_code: g.element_code,
      element_name: g.element_name,
      severity: g.severity,
      description: g.description,
      recommendation: g.recommendation,
    })),
    ...result.oaOutput.gaps.map((g) => ({
      submission_id: reassessmentId,
      user_id: userId,
      pillar: 'outcomes_analysis' as const,
      element_code: g.element_code,
      element_name: g.element_name,
      severity: g.severity,
      description: g.description,
      recommendation: g.recommendation,
    })),
    ...result.omOutput.gaps.map((g) => ({
      submission_id: reassessmentId,
      user_id: userId,
      pillar: 'ongoing_monitoring' as const,
      element_code: g.element_code,
      element_name: g.element_name,
      severity: g.severity,
      description: g.description,
      recommendation: g.recommendation,
    })),
  ];

  if (newGapRows.length > 0) {
    const { error: gapsInsertErr } = await db.from('gaps').insert(newGapRows);
    if (gapsInsertErr) {
      Sentry.captureException(gapsInsertErr);
      // Compensating delete to avoid orphan submission row
      await db.from('submissions').delete().eq('id', reassessmentId);
      return errorResponse('DATABASE_ERROR');
    }
  }

  return NextResponse.json(
    {
      reassessment_id: reassessmentId,
      parent_assessment_id: parentSub.id,
      pillar_reassessed: pillar,
      scoring,
      judge_confidence: result.judgeOutput.confidence,
      judge_confidence_label: result.judgeOutput.confidence_label,
      low_confidence_manual_review: result.lowConfidenceManualReview,
      dispute_event_id: (disputeEvent as { id: string }).id,
      created_at: String((newSub as { created_at: string }).created_at),
    },
    { status: 200 }
  );
}
