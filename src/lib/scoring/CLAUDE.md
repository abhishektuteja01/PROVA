# Scoring — CLAUDE.md

Rules for all scoring logic in this folder.

---

## Required Reading
- `docs/SCORING.md` — full scoring formula, weights, deductions, status thresholds
- `docs/SCHEMAS.md` — scoring calculator Zod types

---

## Quick Reference

```
pillarScore = 100 - (criticalGaps × 20) - (majorGaps × 10) - (minorGaps × 5)
pillarScore = max(0, pillarScore)

finalScore = (csScore × 0.40) + (oaScore × 0.35) + (omScore × 0.25)
finalScore = Math.round(finalScore)

status = finalScore >= 80 ? "Compliant"
       : finalScore >= 60 ? "Needs Improvement"
       : "Critical Gaps"
```

## After any change
- Run `npm run test:ai` — flag if any score drifts > 10 points
