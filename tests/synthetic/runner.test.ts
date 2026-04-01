import * as fs from "fs";
import * as path from "path";
import { runCompliance } from "@/lib/agents/orchestrator";
import { calculateScores } from "@/lib/scoring/calculator";
import type { ScoringResult } from "@/lib/validation/schemas";

jest.setTimeout(120_000);

const DOCS_DIR = path.join(__dirname, "documents");
const BASELINE_PATH = path.join(__dirname, "baseline.json");
const DRIFT_THRESHOLD = 10;

// ─── Types ───────────────────────────────────────────────────────────────────

interface PillarAssertion {
  pillar: "conceptual_soundness" | "outcomes_analysis" | "ongoing_monitoring";
  max: number;
}

interface TestCase {
  file: string;
  modelName: string;
  expectedFinalMin: number;
  expectedFinalMax: number;
  pillarAssertions?: PillarAssertion[];
}

interface TestResult {
  scoring: ScoringResult;
  passed: boolean;
}

interface BaselineEntry {
  finalScore: number;
  cs: number;
  oa: number;
  om: number;
  timestamp: string;
}

type Baseline = Record<string, BaselineEntry>;

// ─── Test cases ──────────────────────────────────────────────────────────────

const TEST_CASES: TestCase[] = [
  {
    file: "test_fully_compliant.txt",
    modelName: "Black-Scholes Option Pricing Model",
    expectedFinalMin: 85,
    expectedFinalMax: 100,
  },
  {
    file: "test_missing_conceptual.txt",
    modelName: "Credit Risk Scorecard Model",
    expectedFinalMin: 0,
    expectedFinalMax: 100,
    pillarAssertions: [{ pillar: "conceptual_soundness", max: 40 }],
  },
  {
    file: "test_missing_outcomes.txt",
    modelName: "Mortgage Prepayment Model",
    expectedFinalMin: 0,
    expectedFinalMax: 100,
    pillarAssertions: [{ pillar: "outcomes_analysis", max: 40 }],
  },
  {
    file: "test_missing_monitoring.txt",
    modelName: "Interest Rate Swap Valuation Model",
    expectedFinalMin: 0,
    expectedFinalMax: 100,
    pillarAssertions: [{ pillar: "ongoing_monitoring", max: 40 }],
  },
  {
    file: "test_all_critical_gaps.txt",
    modelName: "Internal Prediction Model",
    expectedFinalMin: 0,
    expectedFinalMax: 30,
  },
  {
    file: "test_prompt_injection.txt",
    modelName: "GARCH Volatility Forecasting Model",
    expectedFinalMin: 60,
    expectedFinalMax: 100,
  },
  {
    file: "test_verbose_low_quality.txt",
    modelName: "ML Credit Risk Model",
    expectedFinalMin: 0,
    expectedFinalMax: 60,
  },
];

// ─── Results collector ───────────────────────────────────────────────────────

const results = new Map<string, TestResult>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function baselineExists(): boolean {
  return fs.existsSync(BASELINE_PATH);
}

function readBaseline(): Baseline {
  return JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8")) as Baseline;
}

function writeBaseline(baseline: Baseline): void {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n");
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

function printSummaryTable(): void {
  const header =
    `${padRight("Document", 35)} | ${padRight("Expected", 12)} | ${padRight("Actual", 6)} | ` +
    `${padRight("CS", 4)} | ${padRight("OA", 4)} | ${padRight("OM", 4)} | Status`;
  const separator = "-".repeat(header.length);

  console.log("\n" + separator);
  console.log("AI REGRESSION TEST RESULTS");
  console.log(separator);
  console.log(header);
  console.log(separator);

  for (const tc of TEST_CASES) {
    const result = results.get(tc.file);
    if (!result) {
      console.log(`${padRight(tc.file, 35)} | ${padRight("—", 12)} | ${padRight("—", 6)} | ${padRight("—", 4)} | ${padRight("—", 4)} | ${padRight("—", 4)} | SKIPPED`);
      continue;
    }
    const { scoring, passed } = result;
    const expected = `${tc.expectedFinalMin}-${tc.expectedFinalMax}`;
    console.log(
      `${padRight(tc.file, 35)} | ${padRight(expected, 12)} | ${padRight(String(scoring.final_score), 6)} | ` +
        `${padRight(String(scoring.pillar_scores.conceptual_soundness), 4)} | ` +
        `${padRight(String(scoring.pillar_scores.outcomes_analysis), 4)} | ` +
        `${padRight(String(scoring.pillar_scores.ongoing_monitoring), 4)} | ` +
        `${passed ? "PASS" : "FAIL"}`
    );
  }
  console.log(separator + "\n");
}

// ─── Suite ───────────────────────────────────────────────────────────────────

const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

const describeOrSkip = hasApiKey ? describe : describe.skip;

if (!hasApiKey) {
  console.warn(
    "\n⚠  ANTHROPIC_API_KEY is not set. Skipping AI regression tests.\n" +
      "   Set the environment variable to run: ANTHROPIC_API_KEY=sk-... npm run test:ai\n"
  );
}

describeOrSkip("AI Regression Suite", () => {
  afterAll(() => {
    printSummaryTable();

    // ── Drift detection ──────────────────────────────────────────────────
    const hasBaseline = baselineExists();
    const newBaseline: Baseline = {};

    for (const tc of TEST_CASES) {
      const result = results.get(tc.file);
      if (!result) continue;
      newBaseline[tc.file] = {
        finalScore: result.scoring.final_score,
        cs: result.scoring.pillar_scores.conceptual_soundness,
        oa: result.scoring.pillar_scores.outcomes_analysis,
        om: result.scoring.pillar_scores.ongoing_monitoring,
        timestamp: new Date().toISOString(),
      };
    }

    if (!hasBaseline) {
      writeBaseline(newBaseline);
      console.log("📋 Baseline created at tests/synthetic/baseline.json (first run).\n");
      return;
    }

    // Compare against existing baseline
    const baseline = readBaseline();
    const drifted: string[] = [];

    for (const tc of TEST_CASES) {
      const result = results.get(tc.file);
      const base = baseline[tc.file];
      if (!result || !base) continue;

      const drift = Math.abs(result.scoring.final_score - base.finalScore);
      if (drift > DRIFT_THRESHOLD) {
        drifted.push(
          `  ${tc.file}: baseline=${base.finalScore}, current=${result.scoring.final_score}, drift=${drift}`
        );
      }
    }

    if (drifted.length > 0) {
      const msg =
        `Score drift detected (threshold: ${DRIFT_THRESHOLD} points):\n` +
        drifted.join("\n");
      console.error("\n❌ " + msg + "\n");
      throw new Error(msg);
    }

    console.log(`✅ No score drift detected (threshold: ${DRIFT_THRESHOLD} points).\n`);
  });

  // ── Individual test cases ────────────────────────────────────────────────

  describe.each(TEST_CASES)(
    "$file",
    ({ file, modelName, expectedFinalMin, expectedFinalMax, pillarAssertions }) => {
      it(`scores within expected range`, async () => {
        const docPath = path.join(DOCS_DIR, file);
        const documentText = fs.readFileSync(docPath, "utf-8");

        const { csOutput, oaOutput, omOutput } = await runCompliance(
          documentText,
          modelName
        );

        const scoring = calculateScores(csOutput, oaOutput, omOutput);

        const inRange =
          scoring.final_score >= expectedFinalMin &&
          scoring.final_score <= expectedFinalMax;

        // Record result before asserting (so summary table always prints)
        results.set(file, { scoring, passed: inRange });

        // First-run calibration hint
        if (!inRange && !baselineExists()) {
          console.warn(
            `\n⚠  Score ${scoring.final_score} outside expected range [${expectedFinalMin}-${expectedFinalMax}] for ${file}.` +
              `\n   If this is correct behavior, adjust the range in TEST_CASES.\n`
          );
        }

        expect(scoring.final_score).toBeGreaterThanOrEqual(expectedFinalMin);
        expect(scoring.final_score).toBeLessThanOrEqual(expectedFinalMax);
      });

      if (pillarAssertions) {
        for (const { pillar, max } of pillarAssertions) {
          it(`${pillar} pillar score < ${max}`, async () => {
            // Re-use result from the range test (already awaited above in serial mode)
            const result = results.get(file);
            if (!result) {
              // If the range test hasn't run yet, run compliance again
              const docPath = path.join(DOCS_DIR, file);
              const documentText = fs.readFileSync(docPath, "utf-8");
              const { csOutput, oaOutput, omOutput } = await runCompliance(
                documentText,
                modelName
              );
              const scoring = calculateScores(csOutput, oaOutput, omOutput);
              results.set(file, {
                scoring,
                passed: scoring.pillar_scores[pillar] < max,
              });
              expect(scoring.pillar_scores[pillar]).toBeLessThan(max);
              return;
            }

            expect(result.scoring.pillar_scores[pillar]).toBeLessThan(max);
          });
        }
      }
    }
  );
});
