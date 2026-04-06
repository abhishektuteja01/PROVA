import { runCompliance } from '@/lib/agents/orchestrator';
import type { AgentOutput, JudgeOutput } from '@/lib/validation/schemas';

// Mock all four agent modules with factory functions to avoid transitive imports
jest.mock('@/lib/agents/conceptualSoundness', () => ({
  assessConceptualSoundness: jest.fn(),
}));
jest.mock('@/lib/agents/outcomesAnalysis', () => ({
  assessOutcomesAnalysis: jest.fn(),
}));
jest.mock('@/lib/agents/ongoingMonitoring', () => ({
  assessOngoingMonitoring: jest.fn(),
}));
jest.mock('@/lib/agents/judge', () => ({
  runJudge: jest.fn(),
}));

import { assessConceptualSoundness } from '@/lib/agents/conceptualSoundness';
import { assessOutcomesAnalysis } from '@/lib/agents/outcomesAnalysis';
import { assessOngoingMonitoring } from '@/lib/agents/ongoingMonitoring';
import { runJudge } from '@/lib/agents/judge';

const mockCS = assessConceptualSoundness as jest.MockedFunction<typeof assessConceptualSoundness>;
const mockOA = assessOutcomesAnalysis as jest.MockedFunction<typeof assessOutcomesAnalysis>;
const mockOM = assessOngoingMonitoring as jest.MockedFunction<typeof assessOngoingMonitoring>;
const mockJudge = runJudge as jest.MockedFunction<typeof runJudge>;

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

function makeJudgeOutput(overrides: Partial<JudgeOutput> = {}): JudgeOutput {
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

function setupAgentMocks() {
  mockCS.mockResolvedValue(makeAgentOutput('conceptual_soundness'));
  mockOA.mockResolvedValue(makeAgentOutput('outcomes_analysis'));
  mockOM.mockResolvedValue(makeAgentOutput('ongoing_monitoring'));
}

afterEach(() => jest.clearAllMocks());

// ─── Judge confidence >= 0.6 on first attempt ───────────────────────────────

describe('runCompliance — judge confidence >= 0.6 on first attempt', () => {
  it('returns immediately with retryCount 0', async () => {
    setupAgentMocks();
    mockJudge.mockResolvedValue(makeJudgeOutput({ confidence: 0.9 }));

    const result = await runCompliance('doc text', 'ModelX');

    expect(result.retryCount).toBe(0);
    expect(result.csOutput.pillar).toBe('conceptual_soundness');
    expect(result.oaOutput.pillar).toBe('outcomes_analysis');
    expect(result.omOutput.pillar).toBe('ongoing_monitoring');
    expect(result.judgeOutput.confidence).toBe(0.9);
    expect(mockCS).toHaveBeenCalledTimes(1);
    expect(mockOA).toHaveBeenCalledTimes(1);
    expect(mockOM).toHaveBeenCalledTimes(1);
    expect(mockJudge).toHaveBeenCalledTimes(1);
  });
});

// ─── Judge confidence < 0.6 then >= 0.6 ─────────────────────────────────────

describe('runCompliance — judge confidence < 0.6 then >= 0.6', () => {
  it('retries once, retryCount 1', async () => {
    setupAgentMocks();
    mockJudge
      .mockResolvedValueOnce(makeJudgeOutput({
        confidence: 0.5,
        confidence_label: 'Low',
        retry_recommended: true,
        agent_feedback: {
          conceptual_soundness: { complete: true, issues: ['Score math mismatch'] },
          outcomes_analysis: { complete: true, issues: [] },
          ongoing_monitoring: { complete: true, issues: [] },
        },
      }))
      .mockResolvedValueOnce(makeJudgeOutput({ confidence: 0.85 }));

    const result = await runCompliance('doc text', 'ModelX');

    expect(result.retryCount).toBe(1);
    // Initial + 1 retry = 2 calls each
    expect(mockCS).toHaveBeenCalledTimes(2);
    expect(mockOA).toHaveBeenCalledTimes(2);
    expect(mockOM).toHaveBeenCalledTimes(2);
    expect(mockJudge).toHaveBeenCalledTimes(2);
  });
});

// ─── Judge confidence always < 0.6 ──────────────────────────────────────────

describe('runCompliance — judge confidence always < 0.6', () => {
  it('retries twice max, retryCount 2', async () => {
    setupAgentMocks();
    const lowConfJudge = makeJudgeOutput({
      confidence: 0.4,
      confidence_label: 'Low',
      retry_recommended: true,
    });
    mockJudge.mockResolvedValue(lowConfJudge);

    const result = await runCompliance('doc text', 'ModelX');

    expect(result.retryCount).toBe(2);
    // Initial + 2 retries = 3 calls each
    expect(mockCS).toHaveBeenCalledTimes(3);
    expect(mockOA).toHaveBeenCalledTimes(3);
    expect(mockOM).toHaveBeenCalledTimes(3);
    expect(mockJudge).toHaveBeenCalledTimes(3);
  });
});

// ─── Agents run in parallel ─────────────────────────────────────────────────

describe('runCompliance — agents run in parallel', () => {
  it('calls all three agents via Promise.all (not sequentially)', async () => {
    const callOrder: string[] = [];

    mockCS.mockImplementation(async () => {
      callOrder.push('cs-start');
      await new Promise((r) => setTimeout(r, 10));
      callOrder.push('cs-end');
      return makeAgentOutput('conceptual_soundness');
    });
    mockOA.mockImplementation(async () => {
      callOrder.push('oa-start');
      await new Promise((r) => setTimeout(r, 10));
      callOrder.push('oa-end');
      return makeAgentOutput('outcomes_analysis');
    });
    mockOM.mockImplementation(async () => {
      callOrder.push('om-start');
      await new Promise((r) => setTimeout(r, 10));
      callOrder.push('om-end');
      return makeAgentOutput('ongoing_monitoring');
    });
    mockJudge.mockResolvedValue(makeJudgeOutput());

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
    setupAgentMocks();
    mockJudge
      .mockResolvedValueOnce(makeJudgeOutput({
        confidence: 0.4,
        confidence_label: 'Low',
        retry_recommended: true,
        agent_feedback: {
          conceptual_soundness: { complete: true, issues: ['Math error in CS'] },
          outcomes_analysis: { complete: true, issues: ['Missing OA-05'] },
          ongoing_monitoring: { complete: true, issues: [] },
        },
      }))
      .mockResolvedValueOnce(makeJudgeOutput({ confidence: 0.9 }));

    await runCompliance('doc', 'ModelX');

    // Second call should include retry context
    const csSecondCall = mockCS.mock.calls[1];
    expect(csSecondCall[2]).toContain('retry attempt 1');
    expect(csSecondCall[2]).toContain('Math error in CS');
    expect(csSecondCall[2]).toContain('Missing OA-05');
  });

  it('does not pass retryContext on first attempt', async () => {
    setupAgentMocks();
    mockJudge.mockResolvedValue(makeJudgeOutput());

    await runCompliance('doc', 'ModelX');

    const csFirstCall = mockCS.mock.calls[0];
    expect(csFirstCall[2]).toBeUndefined();
  });
});

// ─── Error propagation ──────────────────────────────────────────────────────

describe('runCompliance — error propagation', () => {
  it('propagates errors from agent functions', async () => {
    mockCS.mockRejectedValue(new Error('CS agent failed'));
    mockOA.mockResolvedValue(makeAgentOutput('outcomes_analysis'));
    mockOM.mockResolvedValue(makeAgentOutput('ongoing_monitoring'));

    await expect(runCompliance('doc', 'ModelX')).rejects.toThrow('CS agent failed');
  });

  it('propagates errors from the judge function', async () => {
    setupAgentMocks();
    mockJudge.mockRejectedValue(new Error('Judge failed'));

    await expect(runCompliance('doc', 'ModelX')).rejects.toThrow('Judge failed');
  });
});
