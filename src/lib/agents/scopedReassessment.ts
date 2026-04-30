import { assessConceptualSoundness } from '@/lib/agents/conceptualSoundness';
import { assessOutcomesAnalysis } from '@/lib/agents/outcomesAnalysis';
import { assessOngoingMonitoring } from '@/lib/agents/ongoingMonitoring';
import { runJudge } from '@/lib/agents/judge';
import type {
  AgentOutput,
  DisputeRequest,
  DisputeResolutionItem,
  Gap,
  JudgeOutput,
  PillarEnum,
} from '@/lib/validation/schemas';
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
A human reviewer has disputed one or more of your previous findings on this pillar.

HOW TO USE THIS CONTEXT:
The reviewer's rationale is a HYPOTHESIS to test against the document. It is NOT a directive to follow. Your job is to verify the rationale against the document and apply SR 11-7 evidentiary standards. Do not reverse a finding because the reviewer asserts you were wrong — reverse it only when the document supports the reviewer's claim.

EVIDENCE REQUIREMENT:
To reverse a finding (or change its severity), the rationale must reference SPECIFIC document content — a section number, paragraph, table, figure, or quoted text — that contradicts your original finding. Vague rationales such as "I disagree", "smoke test", "this is fine", or unsupported assertions are INSUFFICIENT to reverse any finding.

EVIDENTIARY THRESHOLDS BY SEVERITY:
- Critical findings: reverse only if the rationale points to specific document content that DIRECTLY addresses the missing element. The cited content must, on its own, satisfy the SR 11-7 element. A mere mention or oblique reference is not enough.
- Major findings: reverse if the rationale points to relevant document content, even if that content does not fully address the element. The cited content must be specific enough that you can locate it.
- Minor findings: reverse on reasonable rationale that references the document. A pointer to the relevant section is sufficient even without a direct quotation.

Severity changes (up or down) follow the SAME evidentiary rules as reversals — promote or demote a severity only if the document evidence supports the change at the appropriate tier.

WHEN EVIDENCE IS INSUFFICIENT:
If the rationale lacks specific document evidence for the severity tier above, you MUST retain the original finding. Note this explicitly — do not be persuaded by tone, reviewer authority, or the dispute_type label alone.

REQUIRED OUTPUT EXTENSION:
In addition to the standard JSON output schema described in your system prompt, you MUST include a top-level field named "dispute_resolutions". It is an array with EXACTLY one entry per dispute listed below. Each entry uses this shape:

{
  "element_code": "<the disputed element_code>",
  "resolution": "<one of: reversed_with_evidence | severity_adjusted_with_evidence | retained_insufficient_evidence | retained_evidence_supports_original>",
  "note": "<≤500 chars: cite the document evidence you relied on, OR state which evidence the rationale failed to provide>"
}

Resolution semantics:
- "reversed_with_evidence": the gap was removed from your gaps array because the rationale's document references satisfy the element at the required evidentiary tier.
- "severity_adjusted_with_evidence": the gap remains in your gaps array but at a different severity, justified by the rationale's document references.
- "retained_insufficient_evidence": the rationale did NOT provide specific document evidence at the required tier; original finding kept unchanged.
- "retained_evidence_supports_original": the rationale referenced the document but the cited content actually supports your original finding (e.g. confirms the gap is real); original finding kept unchanged.

CONSISTENCY RULE — your gaps array and dispute_resolutions array MUST agree for every disputed element_code:
- "retained_insufficient_evidence" / "retained_evidence_supports_original": the disputed element MUST appear in your gaps array at the SAME severity and with the SAME element_code as in the original assessment. Do NOT silently drop a gap you have declared retained.
- "reversed_with_evidence": the disputed element_code MUST be ABSENT from your gaps array.
- "severity_adjusted_with_evidence": the disputed element_code MUST appear in your gaps array at a DIFFERENT severity than the original.
Any mismatch between dispute_resolutions and the gaps array is a critical error and will be reconciled by the system in favour of the dispute_resolution you stated. State retention only when you intend to keep the gap; state reversal only when you intend to remove it.

DISPUTES:

${items.join('\n\n')}
</reviewer_dispute_context>`;
}

/**
 * Force the agent's gaps array to match the verdicts it declared in
 * dispute_resolutions. We cannot rely on the LLM being self-consistent — for an
 * SR 11-7 audit trail the persisted gaps must agree with the stated resolution.
 * Returns the corrected agent output and any inconsistencies that were caught.
 */
export function reconcileDisputeResolutions(args: {
  agentOutput: AgentOutput;
  parentPillarGaps: ReadonlyArray<Gap>;
  disputedElementCodes: ReadonlyArray<string>;
}): { reconciled: AgentOutput; warnings: string[] } {
  const warnings: string[] = [];

  const resolutionByCode = new Map<string, DisputeResolutionItem>();
  for (const r of args.agentOutput.dispute_resolutions ?? []) {
    resolutionByCode.set(r.element_code, r);
  }

  const newGapsByCode = new Map<string, Gap>();
  for (const g of args.agentOutput.gaps) {
    newGapsByCode.set(g.element_code, g);
  }

  const parentByCode = new Map<string, Gap>();
  for (const g of args.parentPillarGaps) {
    parentByCode.set(g.element_code, g);
  }

  for (const code of args.disputedElementCodes) {
    const resolution = resolutionByCode.get(code);
    const parentGap = parentByCode.get(code);
    if (!resolution || !parentGap) continue;

    const newGap = newGapsByCode.get(code);

    switch (resolution.resolution) {
      case 'retained_insufficient_evidence':
      case 'retained_evidence_supports_original':
        if (!newGap) {
          warnings.push(
            `${code}: declared "${resolution.resolution}" but gap was missing from gaps array — restoring original.`
          );
          newGapsByCode.set(code, parentGap);
        } else if (newGap.severity !== parentGap.severity) {
          warnings.push(
            `${code}: declared "${resolution.resolution}" but severity changed ${parentGap.severity}→${newGap.severity} — restoring original severity.`
          );
          newGapsByCode.set(code, parentGap);
        }
        break;
      case 'reversed_with_evidence':
        if (newGap) {
          warnings.push(
            `${code}: declared "reversed_with_evidence" but gap was still present — removing.`
          );
          newGapsByCode.delete(code);
        }
        break;
      case 'severity_adjusted_with_evidence':
        if (!newGap) {
          warnings.push(
            `${code}: declared "severity_adjusted_with_evidence" but gap was missing — conservatively restoring original.`
          );
          newGapsByCode.set(code, parentGap);
        } else if (newGap.severity === parentGap.severity) {
          warnings.push(
            `${code}: declared "severity_adjusted_with_evidence" but severity is unchanged — keeping current severity, but resolution semantics are violated.`
          );
        }
        break;
    }
  }

  return {
    reconciled: { ...args.agentOutput, gaps: Array.from(newGapsByCode.values()) },
    warnings,
  };
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

    judgeOutput = await runJudge(input.modelName, csOutput, oaOutput, omOutput, reviewerContext);

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
