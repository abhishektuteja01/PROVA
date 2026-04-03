import { runCompliance } from '@/lib/agents/orchestrator';

// Mock the Anthropic client at the system boundary — the only mock allowed
const mockCreate = jest.fn();
jest.mock('@/lib/anthropic/client', () => ({
  getAnthropicClient: () => ({
    messages: {
      create: mockCreate,
    },
  }),
}));

// ─── Valid response payloads (must pass Zod schemas) ─────────────────────────

const CS_OUTPUT = {
  pillar: 'conceptual_soundness',
  score: 80,
  confidence: 0.85,
  gaps: [],
  summary: 'Test summary for conceptual_soundness.',
};

const OA_OUTPUT = {
  pillar: 'outcomes_analysis',
  score: 80,
  confidence: 0.85,
  gaps: [],
  summary: 'Test summary for outcomes_analysis.',
};

const OM_OUTPUT = {
  pillar: 'ongoing_monitoring',
  score: 80,
  confidence: 0.85,
  gaps: [],
  summary: 'Test summary for ongoing_monitoring.',
};

function makeJudgeJson(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

// ─── Mock helpers ────────────────────────────────────────────────────────────

function apiResponse(json: unknown) {
  return {
    content: [{ type: 'text', text: JSON.stringify(json) }],
    stop_reason: 'end_turn',
  };
}

/**
 * Inspects the system prompt to determine which agent is calling
 * and returns the corresponding valid JSON response.
 */
function routeBySystemPrompt(
  judgeJson: Record<string, unknown> = makeJudgeJson(),
) {
  return (args: { system: string }) => {
    if (args.system.includes('Conceptual Soundness')) {
      return Promise.resolve(apiResponse(CS_OUTPUT));
    }
    if (args.system.includes('Outcomes Analysis')) {
      return Promise.resolve(apiResponse(OA_OUTPUT));
    }
    if (args.system.includes('Ongoing Monitoring')) {
      return Promise.resolve(apiResponse(OM_OUTPUT));
    }
    if (args.system.includes('quality assurance judge')) {
      return Promise.resolve(apiResponse(judgeJson));
    }
    return Promise.reject(new Error('Unexpected system prompt in test'));
  };
}

afterEach(() => jest.clearAllMocks());

// ─── Judge confidence >= 0.6 on first attempt ───────────────────────────────

describe('runCompliance — judge confidence >= 0.6 on first attempt', () => {
  it('returns immediately with retryCount 0', async () => {
    mockCreate.mockImplementation(routeBySystemPrompt());

    const result = await runCompliance('doc text', 'ModelX');

    expect(result.retryCount).toBe(0);
    expect(result.csOutput.pillar).toBe('conceptual_soundness');
    expect(result.oaOutput.pillar).toBe('outcomes_analysis');
    expect(result.omOutput.pillar).toBe('ongoing_monitoring');
    expect(result.judgeOutput.confidence).toBe(0.9);
    // 3 agent calls + 1 judge call = 4 total
    expect(mockCreate).toHaveBeenCalledTimes(4);
  });
});

// ─── Judge confidence < 0.6 then >= 0.6 ─────────────────────────────────────

describe('runCompliance — judge confidence < 0.6 then >= 0.6', () => {
  it('retries once, retryCount 1', async () => {
    let judgeCallCount = 0;
    const lowConfJudge = makeJudgeJson({
      confidence: 0.5,
      confidence_label: 'Low',
      retry_recommended: true,
      agent_feedback: {
        conceptual_soundness: { complete: true, issues: ['Score math mismatch'] },
        outcomes_analysis: { complete: true, issues: [] },
        ongoing_monitoring: { complete: true, issues: [] },
      },
    });
    const highConfJudge = makeJudgeJson({ confidence: 0.85 });

    mockCreate.mockImplementation((args: { system: string }) => {
      if (args.system.includes('quality assurance judge')) {
        judgeCallCount++;
        const json = judgeCallCount === 1 ? lowConfJudge : highConfJudge;
        return Promise.resolve(apiResponse(json));
      }
      // Route agent calls normally
      return routeBySystemPrompt()(args);
    });

    const result = await runCompliance('doc text', 'ModelX');

    expect(result.retryCount).toBe(1);
    // Initial (3 agents + 1 judge) + 1 retry (3 agents + 1 judge) = 8 total
    expect(mockCreate).toHaveBeenCalledTimes(8);
  });
});

// ─── Judge confidence always < 0.6 ──────────────────────────────────────────

describe('runCompliance — judge confidence always < 0.6', () => {
  it('retries twice max, retryCount 2', async () => {
    const lowConfJudge = makeJudgeJson({
      confidence: 0.4,
      confidence_label: 'Low',
      retry_recommended: true,
    });

    mockCreate.mockImplementation(routeBySystemPrompt(lowConfJudge));

    const result = await runCompliance('doc text', 'ModelX');

    expect(result.retryCount).toBe(2);
    // Initial + 2 retries = 3 rounds × 4 calls = 12 total
    expect(mockCreate).toHaveBeenCalledTimes(12);
  });
});

// ─── Agents run in parallel ─────────────────────────────────────────────────

describe('runCompliance — agents run in parallel', () => {
  it('calls all three agents via Promise.all (not sequentially)', async () => {
    const callOrder: string[] = [];

    mockCreate.mockImplementation(async (args: { system: string }) => {
      if (args.system.includes('Conceptual Soundness')) {
        callOrder.push('cs-start');
        await new Promise((r) => setTimeout(r, 10));
        callOrder.push('cs-end');
        return apiResponse(CS_OUTPUT);
      }
      if (args.system.includes('Outcomes Analysis')) {
        callOrder.push('oa-start');
        await new Promise((r) => setTimeout(r, 10));
        callOrder.push('oa-end');
        return apiResponse(OA_OUTPUT);
      }
      if (args.system.includes('Ongoing Monitoring')) {
        callOrder.push('om-start');
        await new Promise((r) => setTimeout(r, 10));
        callOrder.push('om-end');
        return apiResponse(OM_OUTPUT);
      }
      if (args.system.includes('quality assurance judge')) {
        return apiResponse(makeJudgeJson());
      }
      throw new Error('Unexpected system prompt in test');
    });

    await runCompliance('doc', 'ModelX');

    // All three should start before any ends (Promise.all behavior)
    const csStartIdx = callOrder.indexOf('cs-start');
    const oaStartIdx = callOrder.indexOf('oa-start');
    const omStartIdx = callOrder.indexOf('om-start');
    const firstEndIdx = Math.min(
      callOrder.indexOf('cs-end'),
      callOrder.indexOf('oa-end'),
      callOrder.indexOf('om-end'),
    );

    expect(csStartIdx).toBeLessThan(firstEndIdx);
    expect(oaStartIdx).toBeLessThan(firstEndIdx);
    expect(omStartIdx).toBeLessThan(firstEndIdx);
  });
});

// ─── Retry context propagation ──────────────────────────────────────────────

describe('runCompliance — retry context', () => {
  it('passes retryContext to agents on retry with issue details from judge', async () => {
    let judgeCallCount = 0;
    const lowConfJudge = makeJudgeJson({
      confidence: 0.4,
      confidence_label: 'Low',
      retry_recommended: true,
      agent_feedback: {
        conceptual_soundness: { complete: true, issues: ['Math error in CS'] },
        outcomes_analysis: { complete: true, issues: ['Missing OA-05'] },
        ongoing_monitoring: { complete: true, issues: [] },
      },
    });
    const highConfJudge = makeJudgeJson({ confidence: 0.9 });

    const csUserPrompts: string[] = [];

    mockCreate.mockImplementation((args: { system: string; messages: Array<{ content: string }> }) => {
      if (args.system.includes('Conceptual Soundness')) {
        csUserPrompts.push(args.messages[0].content);
        return Promise.resolve(apiResponse(CS_OUTPUT));
      }
      if (args.system.includes('Outcomes Analysis')) {
        return Promise.resolve(apiResponse(OA_OUTPUT));
      }
      if (args.system.includes('Ongoing Monitoring')) {
        return Promise.resolve(apiResponse(OM_OUTPUT));
      }
      if (args.system.includes('quality assurance judge')) {
        judgeCallCount++;
        const json = judgeCallCount === 1 ? lowConfJudge : highConfJudge;
        return Promise.resolve(apiResponse(json));
      }
      return Promise.reject(new Error('Unexpected system prompt'));
    });

    await runCompliance('doc', 'ModelX');

    // Second CS call should include retry context
    expect(csUserPrompts).toHaveLength(2);
    expect(csUserPrompts[1]).toContain('retry attempt 1');
    expect(csUserPrompts[1]).toContain('Math error in CS');
    expect(csUserPrompts[1]).toContain('Missing OA-05');
  });

  it('does not pass retryContext on first attempt', async () => {
    const csUserPrompts: string[] = [];

    mockCreate.mockImplementation((args: { system: string; messages: Array<{ content: string }> }) => {
      if (args.system.includes('Conceptual Soundness')) {
        csUserPrompts.push(args.messages[0].content);
        return Promise.resolve(apiResponse(CS_OUTPUT));
      }
      if (args.system.includes('Outcomes Analysis')) {
        return Promise.resolve(apiResponse(OA_OUTPUT));
      }
      if (args.system.includes('Ongoing Monitoring')) {
        return Promise.resolve(apiResponse(OM_OUTPUT));
      }
      if (args.system.includes('quality assurance judge')) {
        return Promise.resolve(apiResponse(makeJudgeJson()));
      }
      return Promise.reject(new Error('Unexpected system prompt'));
    });

    await runCompliance('doc', 'ModelX');

    expect(csUserPrompts).toHaveLength(1);
    expect(csUserPrompts[0]).not.toContain('retry attempt');
  });
});

// ─── Error propagation ──────────────────────────────────────────────────────

describe('runCompliance — error propagation', () => {
  it('propagates errors from agent functions', async () => {
    mockCreate.mockImplementation((args: { system: string }) => {
      if (args.system.includes('Conceptual Soundness')) {
        return Promise.reject(new Error('CS agent failed'));
      }
      if (args.system.includes('Outcomes Analysis')) {
        return Promise.resolve(apiResponse(OA_OUTPUT));
      }
      if (args.system.includes('Ongoing Monitoring')) {
        return Promise.resolve(apiResponse(OM_OUTPUT));
      }
      return Promise.resolve(apiResponse(makeJudgeJson()));
    });

    await expect(runCompliance('doc', 'ModelX')).rejects.toThrow('CS agent failed');
  });

  it('propagates errors from the judge function', async () => {
    mockCreate.mockImplementation((args: { system: string }) => {
      if (args.system.includes('quality assurance judge')) {
        return Promise.reject(new Error('Judge failed'));
      }
      // Route agent calls normally
      return routeBySystemPrompt()(args);
    });

    await expect(runCompliance('doc', 'ModelX')).rejects.toThrow('Judge failed');
  });
});
