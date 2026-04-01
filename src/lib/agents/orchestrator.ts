import { assessConceptualSoundness } from '@/lib/agents/conceptualSoundness';
import { assessOutcomesAnalysis } from '@/lib/agents/outcomesAnalysis';
import { assessOngoingMonitoring } from '@/lib/agents/ongoingMonitoring';
import { runJudge } from '@/lib/agents/judge';
import { type JudgeOutput } from '@/lib/validation/schemas';
import { type ComplianceRunResult } from '@/types/index';

function buildRetryContext(retryNumber: number, previousIssues: string[]): string {
  return `NOTE: This is retry attempt ${retryNumber} of 2. The previous assessment had confidence below 0.6.\nIssues identified in previous assessment: ${previousIssues.join('; ')}\nThe agents have been asked to re-assess with awareness of these issues.`;
}

function collectIssuesFromJudge(judgeOutput: JudgeOutput): string[] {
  return [
    ...judgeOutput.agent_feedback.conceptual_soundness.issues,
    ...judgeOutput.agent_feedback.outcomes_analysis.issues,
    ...judgeOutput.agent_feedback.ongoing_monitoring.issues,
  ];
}

// Sanitization is the caller's responsibility (the API route).
// The orchestrator receives already-sanitized text.
export async function runCompliance(
  documentText: string,
  modelName: string
): Promise<ComplianceRunResult> {
  let retryCount = 0;
  let previousIssues: string[] = [];

  while (true) {
    const retryContext = retryCount > 0 ? buildRetryContext(retryCount, previousIssues) : undefined;

    const [csOutput, oaOutput, omOutput] = await Promise.all([
      assessConceptualSoundness(documentText, modelName, retryContext),
      assessOutcomesAnalysis(documentText, modelName, retryContext),
      assessOngoingMonitoring(documentText, modelName, retryContext),
    ]);

    const judgeOutput = await runJudge(modelName, csOutput, oaOutput, omOutput, retryContext);

    if (judgeOutput.confidence >= 0.6 || retryCount >= 2) {
      return { csOutput, oaOutput, omOutput, judgeOutput, retryCount };
    }

    previousIssues = collectIssuesFromJudge(judgeOutput);
    retryCount++;
  }
}
