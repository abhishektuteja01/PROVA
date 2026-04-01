import { assessOutcomesAnalysis } from '@/lib/agents/outcomesAnalysis';
import { AgentParseError, AgentSchemaError } from '@/lib/agents/errors';

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

const VALID_AGENT_OUTPUT = {
  pillar: 'outcomes_analysis',
  score: 70,
  confidence: 0.8,
  gaps: [
    {
      element_code: 'OA-03',
      element_name: 'Benchmarking Against Alternative Models',
      severity: 'Critical',
      description: 'No benchmark comparison documented.',
      recommendation: 'Compare model performance against at least one alternative.',
    },
    {
      element_code: 'OA-04',
      element_name: 'Sensitivity Analysis',
      severity: 'Major',
      description: 'Only qualitative sensitivity discussion provided.',
      recommendation: 'Add quantitative sensitivity analysis results.',
    },
  ],
  summary: 'Backtesting and metrics are documented but benchmarking is absent and sensitivity analysis is incomplete.',
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

describe('assessOutcomesAnalysis — happy path', () => {
  it('returns a valid AgentOutput when the API responds with correct JSON', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    const result = await assessOutcomesAnalysis('Some model doc text', 'VaR Model v3');

    expect(result).toEqual(VALID_AGENT_OUTPUT);
  });

  it('returns an AgentOutput with an empty gaps array for a fully compliant document', async () => {
    const compliantOutput = { ...VALID_AGENT_OUTPUT, score: 100, gaps: [] };
    mockApiResponse(JSON.stringify(compliantOutput));

    const result = await assessOutcomesAnalysis('Full doc', 'My Model');

    expect(result.gaps).toHaveLength(0);
    expect(result.score).toBe(100);
  });
});

// ─── Markdown fence stripping ────────────────────────────────────────────────

describe('assessOutcomesAnalysis — markdown fence stripping', () => {
  it('handles markdown-wrapped JSON by stripping ```json fences before parsing', async () => {
    mockApiResponse('```json\n' + JSON.stringify(VALID_AGENT_OUTPUT) + '\n```');

    const result = await assessOutcomesAnalysis('doc', 'ModelX');

    expect(result).toEqual(VALID_AGENT_OUTPUT);
  });

  it('handles bare ``` fences without json language tag', async () => {
    mockApiResponse('```\n' + JSON.stringify(VALID_AGENT_OUTPUT) + '\n```');

    const result = await assessOutcomesAnalysis('doc', 'ModelX');

    expect(result).toEqual(VALID_AGENT_OUTPUT);
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('assessOutcomesAnalysis — error handling', () => {
  it('throws AgentParseError when the API returns non-JSON text', async () => {
    mockApiResponse('The outcomes analysis shows strong performance.');

    await expect(
      assessOutcomesAnalysis('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when stop_reason is max_tokens (truncated)', async () => {
    mockApiResponse('{"pillar": "outcomes_analysis"', 'max_tokens');

    await expect(
      assessOutcomesAnalysis('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when response content array is empty', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [],
    } as never);

    await expect(
      assessOutcomesAnalysis('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when first content block is not a text block', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }],
    } as never);

    await expect(
      assessOutcomesAnalysis('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentSchemaError when the API returns JSON missing required fields', async () => {
    const badOutput = { pillar: 'outcomes_analysis', score: 80 };
    mockApiResponse(JSON.stringify(badOutput));

    await expect(
      assessOutcomesAnalysis('doc', 'ModelX')
    ).rejects.toThrow(AgentSchemaError);
  });

  it('throws AgentSchemaError when a gap contains an invalid element_code', async () => {
    const badOutput = {
      ...VALID_AGENT_OUTPUT,
      gaps: [
        {
          element_code: 'XX-99',
          element_name: 'Fake Element',
          severity: 'Critical',
          description: 'Missing.',
          recommendation: 'Add it.',
        },
      ],
    };
    mockApiResponse(JSON.stringify(badOutput));

    await expect(
      assessOutcomesAnalysis('doc', 'ModelX')
    ).rejects.toThrow(AgentSchemaError);
  });

  it('propagates Anthropic API errors without wrapping', async () => {
    const apiError = new Error('Connection timeout');
    mockCreate.mockRejectedValueOnce(apiError);

    await expect(
      assessOutcomesAnalysis('doc', 'ModelX')
    ).rejects.toThrow('Connection timeout');
  });
});
