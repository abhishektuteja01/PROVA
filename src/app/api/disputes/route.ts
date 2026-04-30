import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { errorResponse } from '@/lib/errors/messages';
import {
  DisputeRequestSchema,
  type DisputeRequest,
  type DisputeResolutionItem,
  type Gap,
  type AgentOutput,
} from '@/lib/validation/schemas';
import {
  pillarFromElementCode,
  reconcileDisputeResolutions,
  runScopedReassessment,
  type Pillar,
} from '@/lib/agents/scopedReassessment';
import { calculateScores } from '@/lib/scoring/calculator';
import { AgentParseError, AgentSchemaError } from '@/lib/agents/errors';

const MODEL_USED = 'claude-haiku-4-5-20251001';

function disputedPillarOutput(
  pillar: Pillar,
  cs: AgentOutput,
  oa: AgentOutput,
  om: AgentOutput
): AgentOutput {
  if (pillar === 'conceptual_soundness') return cs;
  if (pillar === 'outcomes_analysis') return oa;
  return om;
}

function isUniqueViolation(err: { code?: string } | null | undefined): boolean {
  return err?.code === '23505';
}

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
  const requestStartTime = Date.now();

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
    console.error('[disputes] parent submission lookup failed:', parentErr);
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
    console.error('[disputes] gap lookup failed:', gapErr);
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
    console.error('[disputes] dispute_events insert failed:', disputeErr);
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

  // 8a. Reconcile the disputed pillar's gaps array against the agent's stated
  // dispute_resolutions. The LLM is not always self-consistent — the gaps array
  // can silently drift from what the agent declared in dispute_resolutions
  // (e.g. declaring "retained_insufficient_evidence" while still removing the
  // gap). For an SR 11-7 audit trail we force the persisted gaps to match the
  // agent's stated intent. Any reconciliation warnings are logged.
  const parentPillarGaps =
    pillar === 'conceptual_soundness'
      ? csGaps
      : pillar === 'outcomes_analysis'
        ? oaGaps
        : omGaps;

  const disputedAgentRaw =
    pillar === 'conceptual_soundness'
      ? result.csOutput
      : pillar === 'outcomes_analysis'
        ? result.oaOutput
        : result.omOutput;

  const { reconciled: reconciledDisputedAgent, warnings: reconciliationWarnings } =
    reconcileDisputeResolutions({
      agentOutput: disputedAgentRaw,
      parentPillarGaps,
      disputedElementCodes: [gapRow.element_code],
    });

  if (reconciliationWarnings.length > 0) {
    console.warn('[disputes] reconciliation:', reconciliationWarnings.join(' | '));
  }

  const finalCs = pillar === 'conceptual_soundness' ? reconciledDisputedAgent : result.csOutput;
  const finalOa = pillar === 'outcomes_analysis' ? reconciledDisputedAgent : result.oaOutput;
  const finalOm = pillar === 'ongoing_monitoring' ? reconciledDisputedAgent : result.omOutput;

  // 8b. Recalculate scores using the canonical formula on the reconciled gaps
  const scoring = calculateScores(finalCs, finalOa, finalOm);

  // 9. Persist the new submission row, linked via parent_assessment_id.
  // Re-assessments preferably share their parent's version_number — the partial
  // unique index added in the migration only enforces uniqueness for
  // parent_assessment_id IS NULL. If that index isn't in place (e.g. migration
  // not fully applied) we fall back to the next available version_number so the
  // feature still works.
  const newAllGaps: Gap[] = [
    ...finalCs.gaps,
    ...finalOa.gaps,
    ...finalOm.gaps,
  ];

  const baseInsert = {
    model_id: parentSub.model_id,
    user_id: userId,
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
  };

  let newSub: { id: string; created_at: string } | null = null;
  let lastInsertErr: unknown = null;

  // First attempt: share parent's version_number
  {
    const { data, error } = await db
      .from('submissions')
      .insert({ ...baseInsert, version_number: parentSub.version_number })
      .select('id, created_at')
      .single();

    if (!error && data) {
      newSub = data as { id: string; created_at: string };
    } else if (error && !isUniqueViolation(error)) {
      console.error('[disputes] submissions insert failed (parent version):', error);
      lastInsertErr = error;
    } else if (error) {
      lastInsertErr = error;
    }
  }

  // Fallback: next available version_number (covers the case where the partial
  // unique index didn't get applied during migration)
  if (!newSub) {
    const { count, error: countError } = await db
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('model_id', parentSub.model_id)
      .eq('user_id', userId);

    if (countError) {
      console.error('[disputes] version count lookup failed:', countError);
      Sentry.captureException(countError);
      return errorResponse('DATABASE_ERROR');
    }

    const nextVersion = (count ?? 0) + 1;

    const { data, error } = await db
      .from('submissions')
      .insert({ ...baseInsert, version_number: nextVersion })
      .select('id, created_at')
      .single();

    if (error || !data) {
      console.error('[disputes] submissions insert failed (fallback version):', error ?? lastInsertErr);
      Sentry.captureException(error ?? lastInsertErr ?? new Error('Failed to insert reassessment submission'));
      return errorResponse('DATABASE_ERROR');
    }

    newSub = data as { id: string; created_at: string };
  }

  const reassessmentId = String(newSub.id);

  // 10. Persist gaps for the new submission row
  const newGapRows = [
    ...finalCs.gaps.map((g) => ({
      submission_id: reassessmentId,
      user_id: userId,
      pillar: 'conceptual_soundness' as const,
      element_code: g.element_code,
      element_name: g.element_name,
      severity: g.severity,
      description: g.description,
      recommendation: g.recommendation,
    })),
    ...finalOa.gaps.map((g) => ({
      submission_id: reassessmentId,
      user_id: userId,
      pillar: 'outcomes_analysis' as const,
      element_code: g.element_code,
      element_name: g.element_name,
      severity: g.severity,
      description: g.description,
      recommendation: g.recommendation,
    })),
    ...finalOm.gaps.map((g) => ({
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
      console.error('[disputes] gaps insert failed:', gapsInsertErr);
      Sentry.captureException(gapsInsertErr);
      // Compensating delete to avoid orphan submission row
      await db.from('submissions').delete().eq('id', reassessmentId);
      return errorResponse('DATABASE_ERROR');
    }
  }

  // 11. Persist eval row so the disputed pillar's dispute_resolutions are
  // recoverable for the compare view (evals.agent_outputs is JSONB).
  const inputTextHash = createHash('sha256').update(parentSub.document_text).digest('hex');
  const { error: evalError } = await db.from('evals').insert({
    submission_id: reassessmentId,
    input_text_hash: inputTextHash,
    agent_outputs: { cs: finalCs, oa: finalOa, om: finalOm },
    judge_output: result.judgeOutput,
    retry_count: result.retryCount,
    total_latency_ms: Date.now() - requestStartTime,
    model_used: MODEL_USED,
  });

  if (evalError) {
    // Non-fatal: dispute_resolutions won't surface in the compare view, but
    // the re-assessment itself succeeded.
    console.error('[disputes] evals insert failed (non-fatal):', evalError);
    Sentry.captureException(evalError);
  }

  const disputedAgent = disputedPillarOutput(pillar, finalCs, finalOa, finalOm);
  const disputeResolutions: DisputeResolutionItem[] = disputedAgent.dispute_resolutions ?? [];

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
      dispute_resolutions: disputeResolutions,
      created_at: String(newSub.created_at),
    },
    { status: 200 }
  );
}
