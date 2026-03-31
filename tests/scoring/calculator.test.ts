import { calculateScores } from '@/lib/scoring/calculator';
import type { AgentOutput, Gap, ScoringResult } from '@/lib/validation/schemas';

// ─── Factory helpers ──────────────────────────────────────────────────────────

/**
 * Build a minimal valid AgentOutput. Only the fields that vary per test case
 * need to be supplied; all other fields use stable fixed values.
 */
function makeAgentOutput(
  pillar: AgentOutput['pillar'],
  score: number,
  gaps: Gap[],
): AgentOutput {
  return {
    pillar,
    score,
    confidence: 0.9,
    gaps,
    summary: 'Test summary.',
  };
}

/** Build a minimal valid Gap with a given element code and severity. */
function makeGap(
  element_code: Gap['element_code'],
  severity: Gap['severity'],
): Gap {
  return {
    element_code,
    element_name: 'Model Purpose',
    severity,
    description: 'Missing',
    recommendation: 'Add it',
  };
}

// ─── 1. Perfect score — 0 gaps on all pillars ─────────────────────────────────

describe('calculateScores — perfect score (0 gaps on all pillars)', () => {
  it('returns final_score 100, status Compliant, all pillar scores 100, all gap counts 0', () => {
    // CS: 0 gaps → 100 - 0 = 100
    // OA: 0 gaps → 100 - 0 = 100
    // OM: 0 gaps → 100 - 0 = 100
    // finalScore = Math.round(100×0.40 + 100×0.35 + 100×0.25) = Math.round(100) = 100
    const cs = makeAgentOutput('conceptual_soundness', 100, []);
    const oa = makeAgentOutput('outcomes_analysis', 100, []);
    const om = makeAgentOutput('ongoing_monitoring', 100, []);

    const result: ScoringResult = calculateScores(cs, oa, om);

    expect(result.final_score).toBe(100);
    expect(result.status).toBe('Compliant');
    expect(result.pillar_scores.conceptual_soundness).toBe(100);
    expect(result.pillar_scores.outcomes_analysis).toBe(100);
    expect(result.pillar_scores.ongoing_monitoring).toBe(100);
    expect(result.total_gaps).toBe(0);
    expect(result.critical_gap_count).toBe(0);
    expect(result.major_gap_count).toBe(0);
    expect(result.minor_gap_count).toBe(0);
  });
});

// ─── 2. All critical gaps (max deductions) ────────────────────────────────────

describe('calculateScores — all critical gaps (max deductions)', () => {
  it('floors all pillar scores to 0 and returns final_score 0 with status Critical Gaps', () => {
    // CS: 7 Critical gaps → 100 - (7×20) = 100 - 140 = -40 → Math.max(0, -40) = 0
    // OA: 7 Critical gaps → 100 - (7×20) = 100 - 140 = -40 → Math.max(0, -40) = 0
    // OM: 6 Critical gaps → 100 - (6×20) = 100 - 120 = -20 → Math.max(0, -20) = 0
    // finalScore = Math.round(0×0.40 + 0×0.35 + 0×0.25) = 0
    // total_gaps = 7 + 7 + 6 = 20, all Critical
    const csGaps: Gap[] = [
      makeGap('CS-01', 'Critical'),
      makeGap('CS-02', 'Critical'),
      makeGap('CS-03', 'Critical'),
      makeGap('CS-04', 'Critical'),
      makeGap('CS-05', 'Critical'),
      makeGap('CS-06', 'Critical'),
      makeGap('CS-07', 'Critical'),
    ];
    const oaGaps: Gap[] = [
      makeGap('OA-01', 'Critical'),
      makeGap('OA-02', 'Critical'),
      makeGap('OA-03', 'Critical'),
      makeGap('OA-04', 'Critical'),
      makeGap('OA-05', 'Critical'),
      makeGap('OA-06', 'Critical'),
      makeGap('OA-07', 'Critical'),
    ];
    const omGaps: Gap[] = [
      makeGap('OM-01', 'Critical'),
      makeGap('OM-02', 'Critical'),
      makeGap('OM-03', 'Critical'),
      makeGap('OM-04', 'Critical'),
      makeGap('OM-05', 'Critical'),
      makeGap('OM-06', 'Critical'),
    ];

    const cs = makeAgentOutput('conceptual_soundness', 0, csGaps);
    const oa = makeAgentOutput('outcomes_analysis', 0, oaGaps);
    const om = makeAgentOutput('ongoing_monitoring', 0, omGaps);

    const result: ScoringResult = calculateScores(cs, oa, om);

    expect(result.pillar_scores.conceptual_soundness).toBe(0);
    expect(result.pillar_scores.outcomes_analysis).toBe(0);
    expect(result.pillar_scores.ongoing_monitoring).toBe(0);
    expect(result.final_score).toBe(0);
    expect(result.status).toBe('Critical Gaps');
    // 7 (CS) + 7 (OA) + 6 (OM) = 20
    expect(result.total_gaps).toBe(20);
    expect(result.critical_gap_count).toBe(20);
  });
});

// ─── 3. Mixed gaps — verify weighted average math ────────────────────────────

describe('calculateScores — mixed gaps (weighted average math)', () => {
  it('returns correct final_score, status, and gap counts for mixed severity gaps', () => {
    // CS: 1 Critical + 1 Major → 100 - (1×20) - (1×10) = 100 - 30 = 70
    // OA: 2 Minor → 100 - (2×5) = 100 - 10 = 90
    // OM: 0 gaps → 100 - 0 = 100
    // finalScore = Math.round(70×0.40 + 90×0.35 + 100×0.25)
    //            = Math.round(28 + 31.5 + 25)
    //            = Math.round(84.5)
    //            = 85
    const csGaps: Gap[] = [
      makeGap('CS-01', 'Critical'),
      makeGap('CS-02', 'Major'),
    ];
    const oaGaps: Gap[] = [
      makeGap('OA-01', 'Minor'),
      makeGap('OA-02', 'Minor'),
    ];

    const cs = makeAgentOutput('conceptual_soundness', 70, csGaps);
    const oa = makeAgentOutput('outcomes_analysis', 90, oaGaps);
    const om = makeAgentOutput('ongoing_monitoring', 100, []);

    const result: ScoringResult = calculateScores(cs, oa, om);

    expect(result.final_score).toBe(85);
    expect(result.status).toBe('Compliant');
    // 2 (CS) + 2 (OA) + 0 (OM) = 4
    expect(result.total_gaps).toBe(4);
    expect(result.critical_gap_count).toBe(1);
    expect(result.major_gap_count).toBe(1);
    expect(result.minor_gap_count).toBe(2);
  });
});

// ─── 4. Score floor — more than 5 critical gaps drives one pillar to 0 ────────

describe('calculateScores — score floor (>5 critical gaps on one pillar)', () => {
  it('floors conceptual_soundness to 0 (not negative) when 6 critical gaps are present', () => {
    // CS: 6 Critical gaps → 100 - (6×20) = 100 - 120 = -20 → Math.max(0, -20) = 0
    // OA: 0 gaps → 100
    // OM: 0 gaps → 100
    const csGaps: Gap[] = [
      makeGap('CS-01', 'Critical'),
      makeGap('CS-02', 'Critical'),
      makeGap('CS-03', 'Critical'),
      makeGap('CS-04', 'Critical'),
      makeGap('CS-05', 'Critical'),
      makeGap('CS-06', 'Critical'),
    ];

    const cs = makeAgentOutput('conceptual_soundness', 0, csGaps);
    const oa = makeAgentOutput('outcomes_analysis', 100, []);
    const om = makeAgentOutput('ongoing_monitoring', 100, []);

    const result: ScoringResult = calculateScores(cs, oa, om);

    expect(result.pillar_scores.conceptual_soundness).toBe(0);
    // Verify no negative value leaked through
    expect(result.pillar_scores.conceptual_soundness).toBeGreaterThanOrEqual(0);
  });
});

// ─── 5. Status thresholds — exact boundary values ────────────────────────────

describe('calculateScores — status thresholds (exact boundary values)', () => {
  it('returns Compliant when finalScore === 80', () => {
    // CS: 1 Critical → 100 - 20 = 80
    // OA: 1 Critical → 100 - 20 = 80
    // OM: 1 Critical → 100 - 20 = 80
    // finalScore = Math.round(80×0.40 + 80×0.35 + 80×0.25)
    //            = Math.round(32 + 28 + 20) = Math.round(80) = 80
    const cs = makeAgentOutput('conceptual_soundness', 80, [makeGap('CS-01', 'Critical')]);
    const oa = makeAgentOutput('outcomes_analysis', 80, [makeGap('OA-01', 'Critical')]);
    const om = makeAgentOutput('ongoing_monitoring', 80, [makeGap('OM-01', 'Critical')]);

    const result: ScoringResult = calculateScores(cs, oa, om);

    expect(result.final_score).toBe(80);
    expect(result.status).toBe('Compliant');
  });

  it('returns Needs Improvement when finalScore === 79', () => {
    // CS: 2 Critical + 1 Minor → 100 - (2×20) - (1×5) = 100 - 45 = 55
    // OA: 2 Minor → 100 - (2×5) = 100 - 10 = 90
    // OM: 0 gaps → 100
    // finalScore = Math.round(55×0.40 + 90×0.35 + 100×0.25)
    //            = Math.round(22 + 31.5 + 25) = Math.round(78.5) = 79
    const csGaps: Gap[] = [
      makeGap('CS-01', 'Critical'),
      makeGap('CS-02', 'Critical'),
      makeGap('CS-03', 'Minor'),
    ];
    const oaGaps: Gap[] = [
      makeGap('OA-01', 'Minor'),
      makeGap('OA-02', 'Minor'),
    ];

    const cs = makeAgentOutput('conceptual_soundness', 55, csGaps);
    const oa = makeAgentOutput('outcomes_analysis', 90, oaGaps);
    const om = makeAgentOutput('ongoing_monitoring', 100, []);

    const result: ScoringResult = calculateScores(cs, oa, om);

    expect(result.final_score).toBe(79);
    expect(result.status).toBe('Needs Improvement');
  });

  it('returns Needs Improvement when finalScore === 60', () => {
    // CS: 1 Critical + 2 Major → 100 - (1×20) - (2×10) = 100 - 40 = 60
    // OA: 1 Critical + 2 Major → 100 - (1×20) - (2×10) = 60
    // OM: 1 Critical + 2 Major → 100 - (1×20) - (2×10) = 60
    // finalScore = Math.round(60×0.40 + 60×0.35 + 60×0.25)
    //            = Math.round(24 + 21 + 15) = Math.round(60) = 60
    function make60Gaps(
      codes: [Gap['element_code'], Gap['element_code'], Gap['element_code']],
    ): Gap[] {
      return [
        makeGap(codes[0], 'Critical'),
        makeGap(codes[1], 'Major'),
        makeGap(codes[2], 'Major'),
      ];
    }

    const cs = makeAgentOutput('conceptual_soundness', 60, make60Gaps(['CS-01', 'CS-02', 'CS-03']));
    const oa = makeAgentOutput('outcomes_analysis', 60, make60Gaps(['OA-01', 'OA-02', 'OA-03']));
    const om = makeAgentOutput('ongoing_monitoring', 60, make60Gaps(['OM-01', 'OM-02', 'OM-03']));

    const result: ScoringResult = calculateScores(cs, oa, om);

    expect(result.final_score).toBe(60);
    expect(result.status).toBe('Needs Improvement');
  });

  it('returns Critical Gaps when finalScore === 59', () => {
    // CS: 2 Critical + 1 Minor → 100 - (2×20) - (1×5) = 100 - 45 = 55
    // OA: 2 Critical → 100 - (2×20) = 100 - 40 = 60
    // OM: 2 Critical + 1 Minor → 100 - (2×20) - (1×5) = 100 - 45 = 55
    // finalScore = Math.round(55×0.40 + 60×0.35 + 55×0.25)
    //            = Math.round(22 + 21 + 13.75) = Math.round(56.75) = 57
    // ↑ That gives 57. Adjust to reach exactly 59:
    // CS: 2 Critical + 1 Minor = 55, OA: 2 Minor = 90, OM: 1 Critical + 3 Minor = 100-20-15 = 65
    // finalScore = Math.round(55×0.40 + 90×0.35 + 65×0.25)
    //            = Math.round(22 + 31.5 + 16.25) = Math.round(69.75) = 70 — too high.
    //
    // Work backwards: need x such that Math.round(x) = 59 → x ∈ [58.5, 59.49]
    // Set CS=55, OA=60, OM=65:
    //   55×0.40 + 60×0.35 + 65×0.25 = 22 + 21 + 16.25 = 59.25 → Math.round(59.25) = 59 ✓
    // CS=55: 2 Critical + 1 Minor → 100 - 40 - 5 = 55 ✓
    // OA=60: 2 Critical → 100 - 40 = 60 ✓
    // OM=65: 1 Critical + 3 Minor → 100 - 20 - 15 = 65 ✓
    const csGaps: Gap[] = [
      makeGap('CS-01', 'Critical'),
      makeGap('CS-02', 'Critical'),
      makeGap('CS-03', 'Minor'),
    ];
    const oaGaps: Gap[] = [
      makeGap('OA-01', 'Critical'),
      makeGap('OA-02', 'Critical'),
    ];
    const omGaps: Gap[] = [
      makeGap('OM-01', 'Critical'),
      makeGap('OM-02', 'Minor'),
      makeGap('OM-03', 'Minor'),
      makeGap('OM-04', 'Minor'),
    ];

    const cs = makeAgentOutput('conceptual_soundness', 55, csGaps);
    const oa = makeAgentOutput('outcomes_analysis', 60, oaGaps);
    const om = makeAgentOutput('ongoing_monitoring', 65, omGaps);

    const result: ScoringResult = calculateScores(cs, oa, om);

    expect(result.final_score).toBe(59);
    expect(result.status).toBe('Critical Gaps');
  });
});

// ─── 6. Discrepancy detection — agent reports wrong score, calculator recalculates ──

describe('calculateScores — discrepancy detection', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('uses the recalculated pillar score (not the agent-reported score) when they differ', () => {
    // CS: 1 Major gap → calculated = 100 - (1×10) = 90
    //     but agent falsely reports score = 75
    // OA: 0 gaps → 100
    // OM: 0 gaps → 100
    const cs = makeAgentOutput('conceptual_soundness', 75 /* wrong */, [
      makeGap('CS-01', 'Major'),
    ]);
    const oa = makeAgentOutput('outcomes_analysis', 100, []);
    const om = makeAgentOutput('ongoing_monitoring', 100, []);

    const result: ScoringResult = calculateScores(cs, oa, om);

    // Calculator must use 90 (recalculated), never 75 (agent-reported)
    expect(result.pillar_scores.conceptual_soundness).toBe(90);
  });

  it('calls console.warn when agent-reported score differs from recalculated score', () => {
    // Same setup: agent reports 75, calculated is 90 — a discrepancy
    const cs = makeAgentOutput('conceptual_soundness', 75 /* wrong */, [
      makeGap('CS-01', 'Major'),
    ]);
    const oa = makeAgentOutput('outcomes_analysis', 100, []);
    const om = makeAgentOutput('ongoing_monitoring', 100, []);

    calculateScores(cs, oa, om);

    expect(warnSpy).toHaveBeenCalled();
  });

  it('includes the word "discrepancy" in the console.warn message', () => {
    // Same setup again
    const cs = makeAgentOutput('conceptual_soundness', 75 /* wrong */, [
      makeGap('CS-01', 'Major'),
    ]);
    const oa = makeAgentOutput('outcomes_analysis', 100, []);
    const om = makeAgentOutput('ongoing_monitoring', 100, []);

    calculateScores(cs, oa, om);

    const warnArgs = warnSpy.mock.calls.flat().join(' ');
    expect(warnArgs.toLowerCase()).toContain('discrepancy');
  });

  it('does NOT call console.warn when agent-reported score matches recalculated score', () => {
    // CS: 1 Major gap → 100 - 10 = 90; agent correctly reports 90 — no discrepancy
    const cs = makeAgentOutput('conceptual_soundness', 90 /* correct */, [
      makeGap('CS-01', 'Major'),
    ]);
    const oa = makeAgentOutput('outcomes_analysis', 100, []);
    const om = makeAgentOutput('ongoing_monitoring', 100, []);

    calculateScores(cs, oa, om);

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
