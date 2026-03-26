# Scoring System

Extracted from PRD Sections 3.5–3.6, 14.3. This is the focused reference for scoring work.

---

## Scoring Formula

```
pillarScore = 100 - (criticalGaps × 20) - (majorGaps × 10) - (minorGaps × 5)
pillarScore = max(0, pillarScore)   // floor at 0, never negative

finalScore = (csScore × 0.40) + (oaScore × 0.35) + (omScore × 0.25)
finalScore = Math.round(finalScore)

status = finalScore >= 80 ? "Compliant"
       : finalScore >= 60 ? "Needs Improvement"
       : "Critical Gaps"
```

## Pillar Weights

| Pillar | Weight |
|--------|--------|
| Conceptual Soundness | 40% |
| Outcomes Analysis | 35% |
| Ongoing Monitoring | 25% |

## Gap Severity Deductions

| Severity | Deduction | Definition |
|----------|-----------|------------|
| Critical | -20 | Required SR 11-7 element completely absent |
| Major | -10 | Element present but substantially incomplete |
| Minor | -5 | Element present, minor documentation gaps |

## Score Display

| Range | Color | Status |
|-------|-------|--------|
| 80–100 | Green | Compliant |
| 60–79 | Amber | Needs Improvement |
| 0–59 | Red | Critical Gaps |

## Remediation Recommendations

- Category-level recommendations per identified gap
- Mapped to SR 11-7 pillar and element code
- Prioritized by severity (Critical first)
- Example: "CS-03 — Add explicit documentation of all key model assumptions"

See `docs/SCHEMAS.md` for scoring calculator Zod types.
