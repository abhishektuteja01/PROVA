import { assessConceptualSoundness } from '@/lib/agents/conceptualSoundness';
import { sanitizeText } from '@/lib/security/sanitize';
import { type AgentOutput } from '@/lib/validation/schemas';

// Sprint 1: single agent only
// Sprint 2 will add the other two agents, judge, and retry loop
export async function runCompliance(
  documentText: string,
  modelName: string
): Promise<{
  csOutput: AgentOutput;
  retryCount: number;
}> {
  // Sanitization happens here — the orchestrator owns the AI boundary.
  // This strips HTML tags (including any </document> delimiter breakout attempts),
  // script content, null bytes, and event handler attributes before any agent sees the text.
  const sanitized = sanitizeText(documentText);

  const csOutput = await assessConceptualSoundness(sanitized, modelName);

  return {
    csOutput,
    retryCount: 0,
  };
}
