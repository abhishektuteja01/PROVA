# Synthetic eval — drift + calibration

Two-layer eval system over the 8 synthetic SR 11-7 documents in `tests/synthetic/documents/`.

| Layer | Asks | Source of truth | When it runs |
|-------|------|-----------------|--------------|
| **Drift** (`runner.test.ts`) | "Did we break it?" | `baseline.json` — final + per-pillar scores from a previous run | Every PR via `.github/workflows/pr.yml` |
| **Calibration** (`calibration.test.ts`) | "Is it right?" | `golden_labels.json` — per-element ground-truth labels reviewed by a human | On demand once labels are promoted |

Drift catches regressions. Calibration measures whether the production agents actually detect the gaps a competent SR 11-7 reviewer would expect.

---

## ⚠ Drafted labels are not ground truth

`golden_labels.draft.json` was machine-drafted during the harness build, not authored by a human reviewer. **It must be human-reviewed before promotion.** The harness reads `golden_labels.json` (no `.draft` suffix), so the draft file cannot accidentally become a CI gate.

When reviewing, prioritize labels with `"ambiguous": true` — those are the cases where a competent reviewer might disagree with the drafted call.

---

## Promotion workflow

1. Read through `golden_labels.draft.json`. Adjust labels against the underlying document content.
2. Pay particular attention to entries where `ambiguous: true`.
3. When labels are trusted as ground truth, rename:

   ```bash
   mv tests/synthetic/golden_labels.draft.json tests/synthetic/golden_labels.json
   ```

4. The calibration test now activates. Run it:

   ```bash
   ANTHROPIC_API_KEY=sk-... npm run test:ai:calibration
   ```

5. The harness writes `tests/synthetic/calibration-report.json` with per-element recall, precision, and severity-agreement.

There is intentionally no automated promotion path. The rename is the human sign-off.

---

## How to run

```bash
# Drift test — compares scores against baseline.json (~2 min)
ANTHROPIC_API_KEY=sk-... npm run test:ai

# Calibration test — per-element accuracy against promoted labels (~3-5 min)
ANTHROPIC_API_KEY=sk-... npm run test:ai:calibration
```

The drift test runs in CI. Calibration runs on demand only — even after labels are promoted, it is not automatically wired into `pr.yml`. Add it there explicitly when you decide it should gate merges.

If `golden_labels.json` does not exist, calibration **skips gracefully** with a console warning. It never fails CI.

---

## Calibration metrics

For each `(pillar, element_id)` aggregated across all promoted docs:

- **Recall** = `must_detect=true` labels caught by the agent / total `must_detect=true` labels.
- **Precision** = agent flags that match a `weak`/`missing` label / total agent flags for this element.
- **Severity agreement** = matched gaps where agent severity (`Critical`/`Major`/`Minor`) matches `expected_severity` / total matched gaps with a labeled severity.

Aggregates are also computed per pillar and overall.

### Pass/fail thresholds

| Recall | Outcome |
|--------|---------|
| ≥ 0.85 | Pass silently |
| 0.70 – 0.85 | Watchlist warning (test passes; surfaced in console + report) |
| < 0.70 | **Fail** |

These thresholds apply only to `(pillar, element_id)` pairs with at least one `must_detect=true` label.

---

## Label file shape

```json
[
  {
    "doc_id": "test_cecl_compliant",
    "model_type": "allowance_cecl_cre",
    "elements": [
      {
        "pillar": "conceptual_soundness",
        "element_id": "CS-01",
        "element_name": "Model Purpose and Intended Use",
        "expected_status": "present | weak | missing | not_applicable",
        "expected_severity": "critical | major | minor | null",
        "must_detect": true | false,
        "rationale": "Why this label, grounded in the document.",
        "ambiguous": true | false
      }
    ]
  }
]
```

- `expected_severity` is `null` when `expected_status` is `present` or `not_applicable`.
- `must_detect=true` means a competent reviewer would expect the agent to surface this gap. Reserve it for clear cases.
- The agent emits severity as `Critical`/`Major`/`Minor`; labels use lowercase `critical`/`major`/`minor`. The harness compares case-insensitively.

The harness does not consume `model_type` for execution — it is informational metadata for human reviewers grouping similar documents.

---

## Element ID mapping

The label file uses zero-padded element IDs (`CS-01`, not `CS-1`) to match `ElementCodeEnum` in `src/lib/validation/schemas.ts` and the prompts in `docs/AGENT_PROMPTS.md`.

### Conceptual Soundness (CS) — pillar weight 40%

| ID | Element |
|----|---------|
| CS-01 | Model Purpose and Intended Use |
| CS-02 | Theoretical and Mathematical Framework |
| CS-03 | Key Assumptions Documentation |
| CS-04 | Assumption Limitations and Boundaries |
| CS-05 | Data Inputs and Sources |
| CS-06 | Model Scope and Applicability |
| CS-07 | Known Model Weaknesses |

### Outcomes Analysis (OA) — pillar weight 35%

| ID | Element |
|----|---------|
| OA-01 | Backtesting Methodology |
| OA-02 | Performance Metrics Definition and Reporting |
| OA-03 | Benchmarking Against Alternative Models |
| OA-04 | Sensitivity Analysis |
| OA-05 | Stress Testing |
| OA-06 | Out-of-Sample Testing |
| OA-07 | Statistical Validation Results |

### Ongoing Monitoring (OM) — pillar weight 25%

| ID | Element |
|----|---------|
| OM-01 | KPIs and Performance Thresholds |
| OM-02 | Monitoring Frequency |
| OM-03 | Escalation Procedures |
| OM-04 | Trigger Conditions for Model Review |
| OM-05 | Data Quality Monitoring |
| OM-06 | Change Management Process |

---

## Files

```
tests/synthetic/
├── README.md                       — this file
├── runner.test.ts                  — drift suite (unchanged)
├── calibration.test.ts             — calibration suite (this addition)
├── baseline.json                   — drift reference scores
├── golden_labels.draft.json        — drafted, not yet trusted
├── golden_labels.json              — promoted labels (created by manual rename)
├── calibration-report.json         — written by calibration suite each run
└── documents/                      — 8 synthetic test documents
```
