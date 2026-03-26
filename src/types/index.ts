import { type AgentOutput } from '@/lib/validation/schemas';

/**
 * Result of a full compliance run through the orchestrator.
 * Sprint 1: only csOutput is present.
 * Sprint 2: will add oaOutput, omOutput, and judgeOutput.
 */
export interface ComplianceRunResult {
  csOutput: AgentOutput;
  // Sprint 2:
  // oaOutput: AgentOutput;
  // omOutput: AgentOutput;
  // judgeOutput: JudgeOutput;
  retryCount: number;
}
