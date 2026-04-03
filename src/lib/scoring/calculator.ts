import {
  Gap,
  AgentOutput,
  ScoringResult,
  ScoringResultSchema,
  Status,
} from "@/lib/validation/schemas";

/**
 * Recalculate a pillar score from gaps using the canonical formula:
 *   score = 100 - (criticalCount × 20) - (majorCount × 10) - (minorCount × 5)
 *   score = Math.max(0, score)
 *
 * If the agent-reported score differs from the calculated score, a warning is
 * logged but the calculated value is always returned — we never trust the
 * agent-reported score.
 */
function verifyPillarScore(agentScore: number, gaps: Gap[]): number {
  const criticalCount = gaps.filter((g) => g.severity === "Critical").length;
  const majorCount = gaps.filter((g) => g.severity === "Major").length;
  const minorCount = gaps.filter((g) => g.severity === "Minor").length;

  const calculated = Math.max(
    0,
    100 - criticalCount * 20 - majorCount * 10 - minorCount * 5
  );

  if (agentScore !== calculated) {
    console.warn(
      `[scoring] Pillar score discrepancy: agent reported ${agentScore}, calculated ${calculated} from gaps`
    );
  }

  return calculated;
}

export function deriveStatus(score: number): Status {
  if (score >= 80) return "Compliant";
  if (score >= 60) return "Needs Improvement";
  return "Critical Gaps";
}

/**
 * Combine three agent outputs into a validated ScoringResult.
 *
 * Pillar weights:
 *   Conceptual Soundness  40 %
 *   Outcomes Analysis     35 %
 *   Ongoing Monitoring    25 %
 */
export function calculateScores(
  csOutput: AgentOutput,
  oaOutput: AgentOutput,
  omOutput: AgentOutput
): ScoringResult {
  // Verify (and override) each pillar score from the raw gaps.
  const csScore = verifyPillarScore(csOutput.score, csOutput.gaps);
  const oaScore = verifyPillarScore(oaOutput.score, oaOutput.gaps);
  const omScore = verifyPillarScore(omOutput.score, omOutput.gaps);

  // Weighted final score, rounded to the nearest integer.
  const finalScore = Math.round(
    csScore * 0.4 + oaScore * 0.35 + omScore * 0.25
  );

  const status = deriveStatus(finalScore);

  // Aggregate gap counts across all three pillars.
  const allGaps: Gap[] = [
    ...csOutput.gaps,
    ...oaOutput.gaps,
    ...omOutput.gaps,
  ];

  const total_gaps = allGaps.length;
  const critical_gap_count = allGaps.filter(
    (g) => g.severity === "Critical"
  ).length;
  const major_gap_count = allGaps.filter((g) => g.severity === "Major").length;
  const minor_gap_count = allGaps.filter((g) => g.severity === "Minor").length;

  const result = {
    pillar_scores: {
      conceptual_soundness: csScore,
      outcomes_analysis: oaScore,
      ongoing_monitoring: omScore,
    },
    final_score: finalScore,
    status,
    total_gaps,
    critical_gap_count,
    major_gap_count,
    minor_gap_count,
  };

  // Validate against the canonical schema — a parse failure indicates a schema
  // bug, not a user error, so we let the ZodError propagate.
  return ScoringResultSchema.parse(result);
}
