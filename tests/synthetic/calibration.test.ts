import * as fs from "fs";
import * as path from "path";
import { runCompliance } from "@/lib/agents/orchestrator";
import type { AgentOutput, Gap } from "@/lib/validation/schemas";

jest.setTimeout(180_000);

// ─── Constants ───────────────────────────────────────────────────────────────

const DOCS_DIR = path.join(__dirname, "documents");
const LABELS_PATH = path.join(__dirname, "golden_labels.json");
const REPORT_PATH = path.join(__dirname, "calibration-report.json");

const RECALL_FAIL_THRESHOLD = 0.7;
const RECALL_WATCHLIST_THRESHOLD = 0.85;

type Pillar = AgentOutput["pillar"];
type SeverityLower = "critical" | "major" | "minor";
type ExpectedStatus = "present" | "weak" | "missing" | "not_applicable";

// ─── Label / report types (test-only; not API-boundary, not in schemas.ts) ───

interface GoldenLabel {
  pillar: Pillar;
  element_id: string;
  element_name: string;
  expected_status: ExpectedStatus;
  expected_severity: SeverityLower | null;
  must_detect: boolean;
  rationale: string;
  ambiguous: boolean;
}

interface DocLabels {
  doc_id: string;
  model_type: string;
  elements: GoldenLabel[];
}

interface ElementMetric {
  pillar: Pillar;
  element_id: string;
  must_detect_total: number;
  must_detect_caught: number;
  recall: number | null;
  agent_flags_total: number;
  agent_flags_matching_label: number;
  precision: number | null;
  matched_with_severity: number;
  severity_agreements: number;
  severity_agreement: number | null;
  watchlist: boolean;
}

interface PillarMetric {
  pillar: Pillar;
  recall: number | null;
  precision: number | null;
  severity_agreement: number | null;
}

interface PerDocOutcome {
  doc_id: string;
  model_name: string;
  matched: number;
  agent_gap_count: number;
  label_must_detect_count: number;
  recall_on_doc: number | null;
}

interface CalibrationReport {
  generated_at: string;
  doc_count: number;
  thresholds: {
    recall_fail: number;
    recall_watchlist: number;
  };
  per_element: ElementMetric[];
  per_pillar: PillarMetric[];
  overall: {
    recall: number | null;
    precision: number | null;
    severity_agreement: number | null;
  };
  per_doc: PerDocOutcome[];
}

// ─── Hardcoded doc -> agent model name (mirrors runner.test.ts) ──────────────

const MODEL_NAMES: Record<string, string> = {
  test_fully_compliant: "Black-Scholes Option Pricing Model",
  test_missing_conceptual: "Credit Risk Scorecard Model",
  test_missing_outcomes: "Mortgage Prepayment Model",
  test_missing_monitoring: "Interest Rate Swap Valuation Model",
  test_all_critical_gaps: "Internal Prediction Model",
  test_prompt_injection: "GARCH Volatility Forecasting Model",
  test_verbose_low_quality: "ML Credit Risk Model",
  test_cecl_compliant: "CECL Commercial Real Estate Loan Loss Model",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function labelsExist(): boolean {
  return fs.existsSync(LABELS_PATH);
}

function readLabels(): DocLabels[] {
  return JSON.parse(fs.readFileSync(LABELS_PATH, "utf-8")) as DocLabels[];
}

function labelMustBeFlagged(label: GoldenLabel): boolean {
  return (
    label.expected_status === "missing" || label.expected_status === "weak"
  );
}

function gapsForPillar(output: AgentOutput): Gap[] {
  return output.gaps;
}

function safeRatio(num: number, denom: number): number | null {
  return denom === 0 ? null : num / denom;
}

function severityMatches(
  agentSeverity: Gap["severity"],
  expected: SeverityLower | null
): boolean {
  if (!expected) return false;
  return agentSeverity.toLowerCase() === expected;
}

// ─── Skip orchestration ──────────────────────────────────────────────────────

const hasLabels = labelsExist();
const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

if (!hasLabels) {
  console.warn(
    "\n⚠  Calibration labels not yet promoted — see tests/synthetic/README.md\n" +
      "   The harness reads tests/synthetic/golden_labels.json (no .draft suffix).\n" +
      "   Review tests/synthetic/golden_labels.draft.json, then rename to activate.\n"
  );
}

if (hasLabels && !hasApiKey) {
  console.warn(
    "\n⚠  ANTHROPIC_API_KEY is not set. Skipping calibration tests.\n" +
      "   Set the env var to run: ANTHROPIC_API_KEY=sk-... npm run test:ai:calibration\n"
  );
}

const shouldRun = hasLabels && hasApiKey;
const describeOrSkip = shouldRun ? describe : describe.skip;

// ─── Suite ───────────────────────────────────────────────────────────────────

// Jest requires at least one test in a file. When the suite is skipped, this
// placeholder satisfies that constraint and gives the skip a visible name.
if (!shouldRun) {
  describe("Calibration Suite (skipped)", () => {
    it.skip(
      hasLabels
        ? "no ANTHROPIC_API_KEY"
        : "golden_labels.json not promoted — see tests/synthetic/README.md",
      () => undefined
    );
  });
}

describeOrSkip("Calibration Suite", () => {
  const labels: DocLabels[] = shouldRun ? readLabels() : [];
  // Per-doc agent results, populated by per-doc tests in afterAll aggregation.
  const agentResults = new Map<string, AgentOutput[]>();

  afterAll(() => {
    if (!shouldRun) return;

    // ── Aggregation: walk all (doc, label) and (doc, agent_gap) pairs ─────

    type ElementKey = string; // `${pillar}::${element_id}`
    const elementBucket = new Map<
      ElementKey,
      {
        pillar: Pillar;
        element_id: string;
        must_detect_total: number;
        must_detect_caught: number;
        agent_flags_total: number;
        agent_flags_matching_label: number;
        matched_with_severity: number;
        severity_agreements: number;
      }
    >();

    function bucketFor(pillar: Pillar, elementId: string) {
      const key = `${pillar}::${elementId}`;
      let b = elementBucket.get(key);
      if (!b) {
        b = {
          pillar,
          element_id: elementId,
          must_detect_total: 0,
          must_detect_caught: 0,
          agent_flags_total: 0,
          agent_flags_matching_label: 0,
          matched_with_severity: 0,
          severity_agreements: 0,
        };
        elementBucket.set(key, b);
      }
      return b;
    }

    const perDoc: PerDocOutcome[] = [];

    for (const docLabels of labels) {
      const outputs = agentResults.get(docLabels.doc_id);
      if (!outputs) continue;

      // Index labels by (pillar, element_id) for this doc.
      const labelIndex = new Map<string, GoldenLabel>();
      for (const l of docLabels.elements) {
        labelIndex.set(`${l.pillar}::${l.element_id}`, l);
      }

      // Index agent gaps by (pillar, element_code) for this doc — agent may
      // emit only one gap per element per pillar in practice, but if multiple
      // appear we count the first match for severity but each as a flag.
      const flatAgentGaps: Array<{ pillar: Pillar; gap: Gap }> = [];
      for (const out of outputs) {
        for (const g of gapsForPillar(out)) {
          flatAgentGaps.push({ pillar: out.pillar, gap: g });
        }
      }

      let docMustDetectTotal = 0;
      let docMustDetectCaught = 0;
      let docMatched = 0;

      // Recall pass: walk labels.
      for (const label of docLabels.elements) {
        const agentMatched = flatAgentGaps.find(
          (x) =>
            x.pillar === label.pillar && x.gap.element_code === label.element_id
        );

        const bucket = bucketFor(label.pillar, label.element_id);

        if (label.must_detect) {
          bucket.must_detect_total += 1;
          docMustDetectTotal += 1;
          if (agentMatched) {
            bucket.must_detect_caught += 1;
            docMustDetectCaught += 1;
          }
        }

        // Severity agreement is meaningful only when there is a matched gap
        // AND the label expects a severity.
        if (agentMatched && labelMustBeFlagged(label)) {
          docMatched += 1;
          bucket.matched_with_severity += 1;
          if (severityMatches(agentMatched.gap.severity, label.expected_severity)) {
            bucket.severity_agreements += 1;
          }
        }
      }

      // Precision pass: walk all agent gaps for this doc.
      for (const { pillar, gap } of flatAgentGaps) {
        const bucket = bucketFor(pillar, gap.element_code);
        bucket.agent_flags_total += 1;
        const label = labelIndex.get(`${pillar}::${gap.element_code}`);
        if (label && labelMustBeFlagged(label)) {
          bucket.agent_flags_matching_label += 1;
        }
      }

      perDoc.push({
        doc_id: docLabels.doc_id,
        model_name: MODEL_NAMES[docLabels.doc_id] ?? docLabels.doc_id,
        matched: docMatched,
        agent_gap_count: flatAgentGaps.length,
        label_must_detect_count: docMustDetectTotal,
        recall_on_doc: safeRatio(docMustDetectCaught, docMustDetectTotal),
      });
    }

    // ── Build per-element metrics ─────────────────────────────────────────

    const perElement: ElementMetric[] = [];
    for (const b of elementBucket.values()) {
      const recall = safeRatio(b.must_detect_caught, b.must_detect_total);
      const precision = safeRatio(
        b.agent_flags_matching_label,
        b.agent_flags_total
      );
      const sevAgree = safeRatio(b.severity_agreements, b.matched_with_severity);
      const watchlist =
        recall !== null &&
        recall >= RECALL_FAIL_THRESHOLD &&
        recall < RECALL_WATCHLIST_THRESHOLD &&
        b.must_detect_total > 0;

      perElement.push({
        pillar: b.pillar,
        element_id: b.element_id,
        must_detect_total: b.must_detect_total,
        must_detect_caught: b.must_detect_caught,
        recall,
        agent_flags_total: b.agent_flags_total,
        agent_flags_matching_label: b.agent_flags_matching_label,
        precision,
        matched_with_severity: b.matched_with_severity,
        severity_agreements: b.severity_agreements,
        severity_agreement: sevAgree,
        watchlist,
      });
    }

    perElement.sort((a, b) =>
      a.pillar === b.pillar
        ? a.element_id.localeCompare(b.element_id)
        : a.pillar.localeCompare(b.pillar)
    );

    // ── Per-pillar and overall aggregates ─────────────────────────────────

    function aggregate(elements: ElementMetric[]) {
      let mdTotal = 0;
      let mdCaught = 0;
      let flagsTotal = 0;
      let flagsMatching = 0;
      let sevTotal = 0;
      let sevAgree = 0;
      for (const e of elements) {
        mdTotal += e.must_detect_total;
        mdCaught += e.must_detect_caught;
        flagsTotal += e.agent_flags_total;
        flagsMatching += e.agent_flags_matching_label;
        sevTotal += e.matched_with_severity;
        sevAgree += e.severity_agreements;
      }
      return {
        recall: safeRatio(mdCaught, mdTotal),
        precision: safeRatio(flagsMatching, flagsTotal),
        severity_agreement: safeRatio(sevAgree, sevTotal),
      };
    }

    const pillars: Pillar[] = [
      "conceptual_soundness",
      "outcomes_analysis",
      "ongoing_monitoring",
    ];
    const perPillar: PillarMetric[] = pillars.map((pillar) => ({
      pillar,
      ...aggregate(perElement.filter((e) => e.pillar === pillar)),
    }));

    const overall = aggregate(perElement);

    const report: CalibrationReport = {
      generated_at: new Date().toISOString(),
      doc_count: perDoc.length,
      thresholds: {
        recall_fail: RECALL_FAIL_THRESHOLD,
        recall_watchlist: RECALL_WATCHLIST_THRESHOLD,
      },
      per_element: perElement,
      per_pillar: perPillar,
      overall,
      per_doc: perDoc,
    };

    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");

    // ── Console summary ──────────────────────────────────────────────────

    console.log("\n" + "=".repeat(78));
    console.log("CALIBRATION REPORT");
    console.log("=".repeat(78));
    console.log(
      `Docs evaluated: ${report.doc_count}   |   Report: ${path.relative(
        process.cwd(),
        REPORT_PATH
      )}`
    );

    const fmt = (v: number | null) => (v === null ? "  n/a" : v.toFixed(2));

    console.log("\nPer-pillar:");
    for (const p of perPillar) {
      console.log(
        `  ${p.pillar.padEnd(24)} recall=${fmt(p.recall)}  precision=${fmt(
          p.precision
        )}  severity_agree=${fmt(p.severity_agreement)}`
      );
    }
    console.log(
      `\nOverall:                  recall=${fmt(overall.recall)}  precision=${fmt(
        overall.precision
      )}  severity_agree=${fmt(overall.severity_agreement)}`
    );

    // ── Watchlist + failure surfacing ─────────────────────────────────────

    const watchlistEls = perElement.filter((e) => e.watchlist);
    const failingEls = perElement.filter(
      (e) =>
        e.must_detect_total > 0 &&
        e.recall !== null &&
        e.recall < RECALL_FAIL_THRESHOLD
    );

    if (watchlistEls.length > 0) {
      console.log("\n⚠  Watchlist (recall in [0.70, 0.85)):");
      for (const e of watchlistEls) {
        console.log(
          `   ${e.pillar} ${e.element_id} — recall=${(
            e.recall as number
          ).toFixed(2)} (${e.must_detect_caught}/${e.must_detect_total})`
        );
      }
    }

    if (failingEls.length > 0) {
      console.error("\n❌ Calibration failures (recall < 0.70):");
      for (const e of failingEls) {
        console.error(
          `   ${e.pillar} ${e.element_id} — recall=${(
            e.recall as number
          ).toFixed(2)} (${e.must_detect_caught}/${e.must_detect_total})`
        );
      }
      throw new Error(
        `${failingEls.length} element(s) below recall threshold ${RECALL_FAIL_THRESHOLD}. See ${path.relative(
          process.cwd(),
          REPORT_PATH
        )}.`
      );
    }

    console.log(
      `\n✅ All elements with must_detect=true labels meet recall ≥ ${RECALL_FAIL_THRESHOLD}.\n`
    );
  });

  // ── Per-doc tests: run pipeline once, store outputs ────────────────────
  // Guarded because Jest's describe.each rejects an empty input array.

  if (labels.length > 0) {
    describe.each(labels)("$doc_id", (docLabels: DocLabels) => {
      it("runs production pipeline and records agent outputs", async () => {
        const docPath = path.join(DOCS_DIR, `${docLabels.doc_id}.txt`);
        const documentText = fs.readFileSync(docPath, "utf-8");
        const modelName = MODEL_NAMES[docLabels.doc_id];
        if (!modelName) {
          throw new Error(
            `No model name mapping for doc_id="${docLabels.doc_id}". Update MODEL_NAMES in calibration.test.ts.`
          );
        }

        const { csOutput, oaOutput, omOutput } = await runCompliance(
          documentText,
          modelName
        );
        agentResults.set(docLabels.doc_id, [csOutput, oaOutput, omOutput]);

        expect(csOutput.pillar).toBe("conceptual_soundness");
        expect(oaOutput.pillar).toBe("outcomes_analysis");
        expect(omOutput.pillar).toBe("ongoing_monitoring");
      });
    });
  }
});
