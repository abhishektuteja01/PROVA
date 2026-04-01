import { assessOngoingMonitoring } from '@/lib/agents/ongoingMonitoring';
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
  pillar: 'ongoing_monitoring',
  score: 60,
  confidence: 0.75,
  gaps: [
    {
      element_code: 'OM-01',
      element_name: 'KPIs and Performance Thresholds',
      severity: 'Critical',
      description: 'No specific KPIs or performance thresholds defined.',
      recommendation: 'Define measurable KPIs with numeric thresholds.',
    },
    {
      element_code: 'OM-03',
      element_name: 'Escalation Procedures',
      severity: 'Major',
      description: 'General escalation statement without specifics.',
      recommendation: 'Document specific escalation contacts, actions, and timelines.',
    },
  ],
  summary: 'Monitoring frequency and change management are documented but KPIs are absent and escalation procedures are vague.',
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

describe('assessOngoingMonitoring — happy path', () => {
  it('returns a valid AgentOutput when the API responds with correct JSON', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    const result = await assessOngoingMonitoring('Some model doc text', 'Credit Risk v2');

    expect(result).toEqual(VALID_AGENT_OUTPUT);
  });

  it('returns an AgentOutput with an empty gaps array for a fully compliant document', async () => {
    const compliantOutput = { ...VALID_AGENT_OUTPUT, score: 100, gaps: [] };
    mockApiResponse(JSON.stringify(compliantOutput));

    const result = await assessOngoingMonitoring('Full doc', 'My Model');

    expect(result.gaps).toHaveLength(0);
    expect(result.score).toBe(100);
  });
});

// ─── Markdown fence stripping ────────────────────────────────────────────────

describe('assessOngoingMonitoring — markdown fence stripping', () => {
  it('handles markdown-wrapped JSON by stripping ```json fences before parsing', async () => {
    mockApiResponse('```json\n' + JSON.stringify(VALID_AGENT_OUTPUT) + '\n```');

    const result = await assessOngoingMonitoring('doc', 'ModelX');

    expect(result).toEqual(VALID_AGENT_OUTPUT);
  });

  it('handles bare ``` fences without json language tag', async () => {
    mockApiResponse('```\n' + JSON.stringify(VALID_AGENT_OUTPUT) + '\n```');

    const result = await assessOngoingMonitoring('doc', 'ModelX');

    expect(result).toEqual(VALID_AGENT_OUTPUT);
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('assessOngoingMonitoring — error handling', () => {
  it('throws AgentParseError when the API returns non-JSON text', async () => {
    mockApiResponse('The monitoring framework looks reasonable.');

    await expect(
      assessOngoingMonitoring('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when stop_reason is max_tokens (truncated)', async () => {
    mockApiResponse('{"pillar": "ongoing_monitoring"', 'max_tokens');

    await expect(
      assessOngoingMonitoring('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when response content array is empty', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [],
    } as never);

    await expect(
      assessOngoingMonitoring('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when first content block is not a text block', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }],
    } as never);

    await expect(
      assessOngoingMonitoring('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentSchemaError when the API returns JSON missing required fields', async () => {
    const badOutput = { pillar: 'ongoing_monitoring', score: 80 };
    mockApiResponse(JSON.stringify(badOutput));

    await expect(
      assessOngoingMonitoring('doc', 'ModelX')
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
      assessOngoingMonitoring('doc', 'ModelX')
    ).rejects.toThrow(AgentSchemaError);
  });

  it('propagates Anthropic API errors without wrapping', async () => {
    const apiError = new Error('Connection timeout');
    mockCreate.mockRejectedValueOnce(apiError);

    await expect(
      assessOngoingMonitoring('doc', 'ModelX')
    ).rejects.toThrow('Connection timeout');
  });
});
