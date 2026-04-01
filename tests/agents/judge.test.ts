import { runJudge } from '@/lib/agents/judge';
import { AgentParseError, AgentSchemaError } from '@/lib/agents/errors';
import type { AgentOutput } from '@/lib/validation/schemas';

// Mock the Anthropic client at the system boundary
const mockCreate = jest.fn();
jest.mock('@/lib/anthropic/client', () => ({
  getAnthropicClient: () => ({
    messages: {
      create: mockCreate,
    },
  }),
}));

// ─── Factory helpers ──────────────────────────────────────────────────────────

function makeAgentOutput(pillar: AgentOutput['pillar']): AgentOutput {
  return {
    pillar,
    score: 80,
    confidence: 0.85,
    gaps: [],
    summary: 'Test summary for ' + pillar + '.',
  };
}

const VALID_JUDGE_OUTPUT = {
  confidence: 0.9,
  confidence_label: 'High',
  is_consistent: true,
  anomaly_detected: false,
  anomaly_description: null,
  agent_feedback: {
    conceptual_soundness: { complete: true, issues: [] },
    outcomes_analysis: { complete: true, issues: [] },
    ongoing_monitoring: { complete: true, issues: [] },
  },
  retry_recommended: false,
};

function mockApiResponse(text: string, stopReason = 'end_turn') {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: 'text', text }],
    stop_reason: stopReason,
  });
}

afterEach(() => {
  jest.clearAllMocks();
});

// ─── Happy path ───────────────────────────────────────────────────────────────

describe('runJudge — happy path', () => {
  it('returns a valid JudgeOutput when the API responds with correct JSON', async () => {
    mockApiResponse(JSON.stringify(VALID_JUDGE_OUTPUT));

    const result = await runJudge(
      'ModelX',
      makeAgentOutput('conceptual_soundness'),
      makeAgentOutput('outcomes_analysis'),
      makeAgentOutput('ongoing_monitoring'),
    );

    expect(result).toEqual(VALID_JUDGE_OUTPUT);
  });

  it('handles markdown-wrapped JSON by stripping fences before parsing', async () => {
    mockApiResponse('```json\n' + JSON.stringify(VALID_JUDGE_OUTPUT) + '\n```');

    const result = await runJudge(
      'ModelX',
      makeAgentOutput('conceptual_soundness'),
      makeAgentOutput('outcomes_analysis'),
      makeAgentOutput('ongoing_monitoring'),
    );

    expect(result).toEqual(VALID_JUDGE_OUTPUT);
  });
});

// ─── Confidence and retry_recommended ────────────────────────────────────────

describe('runJudge — confidence and retry_recommended', () => {
  it('returns retry_recommended true when confidence < 0.6', async () => {
    const lowConfOutput = {
      ...VALID_JUDGE_OUTPUT,
      confidence: 0.5,
      confidence_label: 'Low',
      retry_recommended: true,
    };
    mockApiResponse(JSON.stringify(lowConfOutput));

    const result = await runJudge(
      'ModelX',
      makeAgentOutput('conceptual_soundness'),
      makeAgentOutput('outcomes_analysis'),
      makeAgentOutput('ongoing_monitoring'),
    );

    expect(result.confidence).toBe(0.5);
    expect(result.retry_recommended).toBe(true);
  });

  it('returns retry_recommended false when confidence >= 0.6', async () => {
    mockApiResponse(JSON.stringify(VALID_JUDGE_OUTPUT));

    const result = await runJudge(
      'ModelX',
      makeAgentOutput('conceptual_soundness'),
      makeAgentOutput('outcomes_analysis'),
      makeAgentOutput('ongoing_monitoring'),
    );

    expect(result.confidence).toBe(0.9);
    expect(result.retry_recommended).toBe(false);
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('runJudge — error handling', () => {
  it('throws AgentParseError when the API returns non-JSON text', async () => {
    mockApiResponse('The assessments are consistent and well-formed.');

    await expect(
      runJudge(
        'ModelX',
        makeAgentOutput('conceptual_soundness'),
        makeAgentOutput('outcomes_analysis'),
        makeAgentOutput('ongoing_monitoring'),
      )
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when stop_reason is max_tokens (truncated)', async () => {
    mockApiResponse('{"confidence": 0.9', 'max_tokens');

    await expect(
      runJudge(
        'ModelX',
        makeAgentOutput('conceptual_soundness'),
        makeAgentOutput('outcomes_analysis'),
        makeAgentOutput('ongoing_monitoring'),
      )
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when response content array is empty', async () => {
    mockCreate.mockResolvedValueOnce({ content: [] } as never);

    await expect(
      runJudge(
        'ModelX',
        makeAgentOutput('conceptual_soundness'),
        makeAgentOutput('outcomes_analysis'),
        makeAgentOutput('ongoing_monitoring'),
      )
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentSchemaError when agent_feedback field is missing', async () => {
    const badOutput = {
      confidence: 0.9,
      confidence_label: 'High',
      is_consistent: true,
      anomaly_detected: false,
      anomaly_description: null,
      retry_recommended: false,
    };
    mockApiResponse(JSON.stringify(badOutput));

    await expect(
      runJudge(
        'ModelX',
        makeAgentOutput('conceptual_soundness'),
        makeAgentOutput('outcomes_analysis'),
        makeAgentOutput('ongoing_monitoring'),
      )
    ).rejects.toThrow(AgentSchemaError);
  });

  it('throws AgentSchemaError when confidence_label has an invalid value', async () => {
    const badOutput = { ...VALID_JUDGE_OUTPUT, confidence_label: 'VeryHigh' };
    mockApiResponse(JSON.stringify(badOutput));

    await expect(
      runJudge(
        'ModelX',
        makeAgentOutput('conceptual_soundness'),
        makeAgentOutput('outcomes_analysis'),
        makeAgentOutput('ongoing_monitoring'),
      )
    ).rejects.toThrow(AgentSchemaError);
  });

  it('propagates Anthropic API errors without wrapping', async () => {
    const apiError = new Error('Service unavailable');
    mockCreate.mockRejectedValueOnce(apiError);

    await expect(
      runJudge(
        'ModelX',
        makeAgentOutput('conceptual_soundness'),
        makeAgentOutput('outcomes_analysis'),
        makeAgentOutput('ongoing_monitoring'),
      )
    ).rejects.toThrow('Service unavailable');
  });
});
