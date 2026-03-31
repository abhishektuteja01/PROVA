import { type AgentOutput, type JudgeOutput } from '@/lib/validation/schemas';

export interface ComplianceRunResult {
  csOutput: AgentOutput;
  oaOutput: AgentOutput;
  omOutput: AgentOutput;
  judgeOutput: JudgeOutput;
  retryCount: number;
}
