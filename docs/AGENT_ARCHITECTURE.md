# Agent Architecture

Extracted from PRD Sections 3.3–3.4, 4, 14.1–14.2, 14.5. This is the focused reference for agent work.

---

## Parallel Agent Architecture

Three agents run in parallel via `Promise.all`, each owning one SR 11-7 validation pillar:

| Agent | Pillar | Elements | Weight |
|-------|--------|----------|--------|
| Agent 1 | Conceptual Soundness | CS-01 through CS-07 (7) | 40% |
| Agent 2 | Outcomes Analysis | OA-01 through OA-07 (7) | 35% |
| Agent 3 | Ongoing Monitoring | OM-01 through OM-06 (6) | 25% |

Exact prompt templates: `docs/AGENT_PROMPTS.md`
JSON output schemas (Zod): `docs/SCHEMAS.md`

---

## LLM-as-Judge Agent

Runs after three parallel agents complete. Reviews their outputs for:
- **Consistency:** do the three agents contradict each other?
- **Completeness:** did each agent assess all required elements?
- **Anomaly detection:** suspicious scoring patterns (prompt injection indicator)
- **Confidence scoring:** 0.0–1.0 uncertainty score

**Retry loop:**
- Judge confidence < 0.6 → all three agents reiterate with original doc + previous outputs
- Max 2 retries before accepting output regardless
- After max retries with confidence still < 0.6 → surface "Low Confidence" warning

**Judge output does NOT affect final compliance score** — separate quality indicator:
- 0.8–1.0: "High" | 0.6–0.79: "Medium" | 0.0–0.59: "Low"

---

## AI Security & Bias Mitigation

**Prompt injection protection:**
- All document text wrapped in `<document>...</document>` XML delimiters
- Agents treat content as data only, never instructions
- Judge checks for anomalous scoring patterns

**Bias mitigations (never remove from prompts):**
- Verbosity: assess quality per section, not word count
- Position: systematic element-by-element in defined order
- Self-enhancement: judge does contrarian review before confidence
- Confidence: all agents output explicit confidence (0.0–1.0)

**Schema validation:**
- Every agent output validated against Zod schema before next stage
- Validation failure → retry (counts toward 2-retry limit)

---

## Agent Output Schema

```typescript
{
  pillar: "conceptual_soundness" | "outcomes_analysis" | "ongoing_monitoring",
  score: number,           // 0-100, after deductions
  confidence: number,      // 0.0-1.0
  gaps: [
    {
      element_code: string,    // e.g. "CS-01", "OA-03", "OM-02"
      element_name: string,
      severity: "Critical" | "Major" | "Minor",
      description: string,
      recommendation: string
    }
  ],
  summary: string          // 2-3 sentence pillar assessment
}
```

## Judge Output Schema

```typescript
{
  confidence: number,          // 0.0-1.0
  confidence_label: "High" | "Medium" | "Low",
  is_consistent: boolean,
  anomaly_detected: boolean,
  anomaly_description: string | null,
  agent_feedback: {
    conceptual_soundness: { complete: boolean, issues: string[] },
    outcomes_analysis:    { complete: boolean, issues: string[] },
    ongoing_monitoring:   { complete: boolean, issues: string[] }
  },
  retry_recommended: boolean   // True if confidence < 0.6
}
```

---

## SR 11-7 Element Codes

**Conceptual Soundness (CS):**
CS-01: Model Purpose and Intended Use | CS-02: Theoretical and Mathematical Framework | CS-03: Key Assumptions Documentation | CS-04: Assumption Limitations and Boundaries | CS-05: Data Inputs and Sources | CS-06: Model Scope and Applicability | CS-07: Known Model Weaknesses

**Outcomes Analysis (OA):**
OA-01: Backtesting Methodology | OA-02: Performance Metrics Definition and Reporting | OA-03: Benchmarking Against Alternative Models | OA-04: Sensitivity Analysis | OA-05: Stress Testing | OA-06: Out-of-Sample Testing | OA-07: Statistical Validation Results

**Ongoing Monitoring (OM):**
OM-01: KPIs and Performance Thresholds | OM-02: Monitoring Frequency | OM-03: Escalation Procedures | OM-04: Trigger Conditions for Model Review | OM-05: Data Quality Monitoring | OM-06: Change Management Process
