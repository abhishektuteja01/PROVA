import { assessConceptualSoundness } from '@/lib/agents/conceptualSoundness';
import { type AgentOutput } from '@/lib/validation/schemas';
import { type ComplianceRunResult } from '@/types/index';

// Sprint 1: single agent only
// Sprint 2 will add the other two agents, judge, and retry loop
export async function runCompliance(
  documentText: string,
  modelName: string
): Promise<ComplianceRunResult> {
  // Sanitization is the caller's responsibility (the API route).
  // The orchestrator receives already-sanitized text.
  const csOutput = await assessConceptualSoundness(documentText, modelName);

  return {
    csOutput,
    retryCount: 0,
  };
}
