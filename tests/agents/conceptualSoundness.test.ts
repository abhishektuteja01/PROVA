import { assessConceptualSoundness } from '@/lib/agents/conceptualSoundness';
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
  pillar: 'conceptual_soundness',
  score: 75,
  confidence: 0.85,
  gaps: [
    {
      element_code: 'CS-04',
      element_name: 'Assumption Limitations and Boundaries',
      severity: 'Critical',
      description: 'No documentation of where assumptions break down.',
      recommendation: 'Add explicit boundary conditions for each assumption.',
    },
  ],
  summary: 'The document covers most elements. CS-04 is absent.',
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

describe('assessConceptualSoundness — happy path', () => {
  it('returns a valid AgentOutput when the API responds with correct JSON', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    const result = await assessConceptualSoundness('Some model doc text', 'Black-Scholes v1');

    expect(result).toEqual(VALID_AGENT_OUTPUT);
  });

  it('returns an AgentOutput with an empty gaps array for a fully compliant document', async () => {
    const compliantOutput = { ...VALID_AGENT_OUTPUT, score: 100, gaps: [] };
    mockApiResponse(JSON.stringify(compliantOutput));

    const result = await assessConceptualSoundness('Full doc', 'My Model');

    expect(result.gaps).toHaveLength(0);
    expect(result.score).toBe(100);
  });
});

// ─── Markdown fence stripping ────────────────────────────────────────────────

describe('assessConceptualSoundness — markdown fence stripping', () => {
  it('handles markdown-wrapped JSON by stripping ```json fences before parsing', async () => {
    mockApiResponse('```json\n' + JSON.stringify(VALID_AGENT_OUTPUT) + '\n```');

    const result = await assessConceptualSoundness('doc', 'ModelX');

    expect(result).toEqual(VALID_AGENT_OUTPUT);
  });

  it('handles bare ``` fences without json language tag', async () => {
    mockApiResponse('```\n' + JSON.stringify(VALID_AGENT_OUTPUT) + '\n```');

    const result = await assessConceptualSoundness('doc', 'ModelX');

    expect(result).toEqual(VALID_AGENT_OUTPUT);
  });
});

// ─── API call parameters ──────────────────────────────────────────────────────

describe('assessConceptualSoundness — API call parameters', () => {
  it('calls the API with the exact model string claude-haiku-4-5-20251001', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc', 'ModelX');

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-haiku-4-5-20251001');
  });

  it('calls the API with max_tokens of 1500', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc', 'ModelX');

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.max_tokens).toBe(1500);
  });

  it('includes SR 11-7 Conceptual Soundness in the system prompt', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc', 'ModelX');

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain('SR 11-7');
    expect(callArgs.system).toContain('Conceptual Soundness');
  });

  it('includes the SECURITY RULE in the system prompt', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc', 'ModelX');

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain('SECURITY RULE');
  });
});

// ─── Prompt construction ──────────────────────────────────────────────────────

describe('assessConceptualSoundness — prompt construction', () => {
  it('wraps document text inside <document> XML delimiters in the user prompt', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));
    const docText = 'This is the model documentation.';

    await assessConceptualSoundness(docText, 'ModelX');

    const userPrompt = (mockCreate.mock.calls[0][0].messages[0] as { content: string }).content;
    expect(userPrompt).toContain(`<document>\n${docText}\n</document>`);
  });

  it('substitutes the modelName into the user prompt', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc text', 'Black-Scholes Pricing Model v2');

    const userPrompt = (mockCreate.mock.calls[0][0].messages[0] as { content: string }).content;
    expect(userPrompt).toContain('Black-Scholes Pricing Model v2');
  });

  it('appends retryContext to the user prompt when provided', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));
    const retryContext = 'NOTE: This is retry attempt 1 of 2.';

    await assessConceptualSoundness('doc text', 'ModelX', retryContext);

    const userPrompt = (mockCreate.mock.calls[0][0].messages[0] as { content: string }).content;
    expect(userPrompt).toContain(retryContext);
  });

  it('does not append retryContext when it is undefined', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc text', 'ModelX');

    const userPrompt = (mockCreate.mock.calls[0][0].messages[0] as { content: string }).content;
    expect(userPrompt).not.toContain('retry attempt');
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('assessConceptualSoundness — error handling', () => {
  it('throws AgentParseError when the API returns non-JSON text', async () => {
    mockApiResponse('Here is my assessment: the document is good.');

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when stop_reason is max_tokens (truncated)', async () => {
    mockApiResponse('{"pillar": "conceptual_soundness"', 'max_tokens');

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when response content array is empty', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [],
    } as never);

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when first content block is not a text block', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }],
    } as never);

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentSchemaError when the API returns JSON missing required fields', async () => {
    const badOutput = { pillar: 'conceptual_soundness', score: 80 };
    mockApiResponse(JSON.stringify(badOutput));

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
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
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow(AgentSchemaError);
  });

  it('propagates Anthropic API errors without wrapping', async () => {
    const apiError = new Error('Connection timeout');
    mockCreate.mockRejectedValueOnce(apiError);

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow('Connection timeout');
  });
});
