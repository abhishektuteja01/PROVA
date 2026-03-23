import {
  assessConceptualSoundness,
  AgentParseError,
  AgentSchemaError,
} from '@/lib/agents/conceptualSoundness';

// Mock the Anthropic client at the system boundary
jest.mock('@/lib/anthropic/client', () => ({
  anthropic: {
    messages: {
      create: jest.fn(),
    },
  },
}));

import { anthropic } from '@/lib/anthropic/client';

const mockCreate = anthropic.messages.create as jest.MockedFunction<
  typeof anthropic.messages.create
>;

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

function mockApiResponse(text: string) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: 'text', text }],
  } as Awaited<ReturnType<typeof anthropic.messages.create>>);
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

// ─── API call parameters ──────────────────────────────────────────────────────

describe('assessConceptualSoundness — API call parameters', () => {
  it('calls the API with the exact model string claude-haiku-3-5-20241022', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc', 'ModelX');

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-haiku-3-5-20241022');
  });

  it('calls the API with max_tokens of 1000', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc', 'ModelX');

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.max_tokens).toBe(1000);
  });

  it('passes the system prompt to the API call', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc', 'ModelX');

    const callArgs = mockCreate.mock.calls[0][0];
    expect(typeof callArgs.system).toBe('string');
    expect((callArgs.system as string).length).toBeGreaterThan(0);
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

  it('includes all four ANTI-BIAS RULES in the system prompt', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc', 'ModelX');

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain('ANTI-BIAS RULES');
    expect(callArgs.system).toContain('QUALITY and COMPLETENESS');
    expect(callArgs.system).toContain('independently');
    expect(callArgs.system).toContain('complete document');
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

  it('does not contain the literal placeholder {modelName} in the sent prompt', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc text', 'ActualModelName');

    const userPrompt = (mockCreate.mock.calls[0][0].messages[0] as { content: string }).content;
    expect(userPrompt).not.toContain('{modelName}');
  });

  it('does not contain the literal placeholder {documentText} in the sent prompt', async () => {
    mockApiResponse(JSON.stringify(VALID_AGENT_OUTPUT));

    await assessConceptualSoundness('doc text', 'ModelX');

    const userPrompt = (mockCreate.mock.calls[0][0].messages[0] as { content: string }).content;
    expect(userPrompt).not.toContain('{documentText}');
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
    const retryContext = 'NOTE: This is retry attempt 1 of 2.';

    await assessConceptualSoundness('doc text', 'ModelX');

    const userPrompt = (mockCreate.mock.calls[0][0].messages[0] as { content: string }).content;
    expect(userPrompt).not.toContain(retryContext);
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

  it('throws AgentParseError when the API returns empty text', async () => {
    mockApiResponse('');

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when the API returns markdown-wrapped JSON', async () => {
    mockApiResponse('```json\n' + JSON.stringify(VALID_AGENT_OUTPUT) + '\n```');

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when response content array is empty', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [],
    } as unknown as Awaited<ReturnType<typeof anthropic.messages.create>>);

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentParseError when first content block is not a text block', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }],
    } as unknown as Awaited<ReturnType<typeof anthropic.messages.create>>);

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow(AgentParseError);
  });

  it('throws AgentSchemaError when the API returns JSON with an unrecognized pillar value', async () => {
    const badOutput = { ...VALID_AGENT_OUTPUT, pillar: 'unknown_pillar' };
    mockApiResponse(JSON.stringify(badOutput));

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow(AgentSchemaError);
  });

  it('throws AgentSchemaError when the API returns JSON with score out of range', async () => {
    const badOutput = { ...VALID_AGENT_OUTPUT, score: 150 };
    mockApiResponse(JSON.stringify(badOutput));

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow(AgentSchemaError);
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

  it('propagates Anthropic API errors (AI_UNAVAILABLE scenario) without wrapping', async () => {
    const apiError = new Error('Connection timeout');
    mockCreate.mockRejectedValueOnce(apiError);

    await expect(
      assessConceptualSoundness('doc', 'ModelX')
    ).rejects.toThrow('Connection timeout');
  });
});
