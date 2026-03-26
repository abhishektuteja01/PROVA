import { runCompliance } from '@/lib/agents/orchestrator';

// Mock at system boundaries
jest.mock('@/lib/anthropic/client', () => ({
  getAnthropicClient: () => ({ messages: { create: jest.fn() } }),
}));

jest.mock('@/lib/agents/conceptualSoundness', () => ({
  assessConceptualSoundness: jest.fn(),
  AgentParseError: class AgentParseError extends Error {},
  AgentSchemaError: class AgentSchemaError extends Error {},
}));

import { assessConceptualSoundness } from '@/lib/agents/conceptualSoundness';

const mockAssess = assessConceptualSoundness as jest.MockedFunction<
  typeof assessConceptualSoundness
>;

const VALID_CS_OUTPUT = {
  pillar: 'conceptual_soundness' as const,
  score: 80,
  confidence: 0.9,
  gaps: [],
  summary: 'Document is largely compliant.',
};

afterEach(() => jest.clearAllMocks());

describe('runCompliance — text passthrough', () => {
  it('passes documentText unchanged to the agent (sanitization is the caller\'s responsibility)', async () => {
    mockAssess.mockResolvedValueOnce(VALID_CS_OUTPUT);

    await runCompliance('Already sanitized text', 'ModelX');

    const passedText = mockAssess.mock.calls[0][0];
    expect(passedText).toBe('Already sanitized text');
  });
});

describe('runCompliance — delegation and return shape', () => {
  it('passes modelName unchanged to assessConceptualSoundness', async () => {
    mockAssess.mockResolvedValueOnce(VALID_CS_OUTPUT);

    await runCompliance('doc', 'Black-Scholes v1');

    expect(mockAssess.mock.calls[0][1]).toBe('Black-Scholes v1');
  });

  it('returns the csOutput from assessConceptualSoundness', async () => {
    mockAssess.mockResolvedValueOnce(VALID_CS_OUTPUT);

    const result = await runCompliance('doc', 'ModelX');

    expect(result.csOutput).toEqual(VALID_CS_OUTPUT);
  });

  it('returns retryCount of 0 in Sprint 1', async () => {
    mockAssess.mockResolvedValueOnce(VALID_CS_OUTPUT);

    const result = await runCompliance('doc', 'ModelX');

    expect(result.retryCount).toBe(0);
  });

  it('propagates errors from assessConceptualSoundness', async () => {
    mockAssess.mockRejectedValueOnce(new Error('Agent failed'));

    await expect(runCompliance('doc', 'ModelX')).rejects.toThrow('Agent failed');
  });
});
