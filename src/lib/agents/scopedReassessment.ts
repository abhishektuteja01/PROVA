import { assessConceptualSoundness } from '@/lib/agents/conceptualSoundness';
import { assessOutcomesAnalysis } from '@/lib/agents/outcomesAnalysis';
import { assessOngoingMonitoring } from '@/lib/agents/ongoingMonitoring';
import { runJudge } from '@/lib/agents/judge';
import type { AgentOutput, DisputeRequest, JudgeOutput, PillarEnum } from '@/lib/validation/schemas';
import type { z } from 'zod';

export type Pillar = z.infer<typeof PillarEnum>;

const REASSESS_CONFIDENCE_THRESHOLD = 0.7;
const MAX_REASSESS_RETRIES = 1;

export function pillarFromElementCode(code: string): Pillar {
  if (code.startsWith('CS-')) return 'conceptual_soundness';
  if (code.startsWith('OA-')) return 'outcomes_analysis';
  if (code.startsWith('OM-')) return 'ongoing_monitoring';
  throw new Error(`Unknown element code prefix: ${code}`);
}

function buildReviewerDisputeContext(
  disputes: ReadonlyArray<Pick<DisputeRequest, 'dispute_type' | 'reviewer_rationale' | 'proposed_resolution'> & { element_code: string }>
): string {
  const items = disputes.map((d, i) => {
    const lines = [
      `[Dispute ${i + 1}]`,
      `Element: ${d.element_code}`,
      `Type: ${d.dispute_type}`,
      `Reviewer rationale: ${d.reviewer_rationale}`,
    ];
    if (d.proposed_resolution) lines.push(`Proposed resolution: ${d.proposed_resolution}`);
    return lines.join('\n');
  });

  return `<reviewer_dispute_context>
A human reviewer has disputed one or more of your previous findings on this pillar. Use the dispute(s) below as additional expert signal during your re-assessment. Apply your own SR 11-7 judgement — do not blindly accept or reject the rationale.

${items.join('\n\n')}
</reviewer_dispute_context>`;
}

export interface ScopedReassessmentResult {
  csOutput: AgentOutput;
  oaOutput: AgentOutput;
  omOutput: AgentOutput;
  judgeOutput: JudgeOutput;
  retryCount: number;
  pillarReassessed: Pillar;
  lowConfidenceManualReview: boolean;
}

export interface ScopedReassessmentInput {
  documentText: string;
  modelName: string;
  pillar: Pillar;
  previousCsOutput: AgentOutput;
  previousOaOutput: AgentOutput;
  previousOmOutput: AgentOutput;
  disputes: ReadonlyArray<
    Pick<DisputeRequest, 'dispute_type' | 'reviewer_rationale' | 'proposed_resolution'> & { element_code: string }
  >;
}

export async function runScopedReassessment(
  input: ScopedReassessmentInput
): Promise<ScopedReassessmentResult> {
  const reviewerContext = buildReviewerDisputeContext(input.disputes);

  let csOutput = input.previousCsOutput;
  let oaOutput = input.previousOaOutput;
  let omOutput = input.previousOmOutput;
  let judgeOutput: JudgeOutput | null = null;
  let retryCount = 0;

  while (true) {
    if (input.pillar === 'conceptual_soundness') {
      csOutput = await assessConceptualSoundness(input.documentText, input.modelName, reviewerContext);
    } else if (input.pillar === 'outcomes_analysis') {
      oaOutput = await assessOutcomesAnalysis(input.documentText, input.modelName, reviewerContext);
    } else {
      omOutput = await assessOngoingMonitoring(input.documentText, input.modelName, reviewerContext);
    }

    judgeOutput = await runJudge(input.modelName, csOutput, oaOutput, omOutput);

    if (judgeOutput.confidence >= REASSESS_CONFIDENCE_THRESHOLD || retryCount >= MAX_REASSESS_RETRIES) {
      break;
    }
    retryCount++;
  }

  const lowConfidenceManualReview = judgeOutput!.confidence < REASSESS_CONFIDENCE_THRESHOLD;

  return {
    csOutput,
    oaOutput,
    omOutput,
    judgeOutput: judgeOutput!,
    retryCount,
    pillarReassessed: input.pillar,
    lowConfidenceManualReview,
  };
}
