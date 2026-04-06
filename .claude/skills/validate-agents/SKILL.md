---
name: validate-agents
description: Run SR 11-7 synthetic test suite against pillar agents and judge. Diagnose failures, validate scoring integrity, and check for regressions.
---

Run the SR 11-7 synthetic test suite against the three pillar agents and judge. Diagnose failures using a structured failure-mode taxonomy. Validate scoring integrity, prompt safety, and cross-pillar consistency.

## When to Use
After any change to:
- Agent system prompts (`docs/AGENT_PROMPTS.md`)
- Scoring calculator (`src/lib/scoring/calculator.ts`)
- Orchestrator logic (`src/lib/agents/orchestrator.ts`)
- Zod schemas in `src/lib/validation/schemas.ts`
- Judge confidence thresholds or retry loop behavior

## Workflow

### Step 1 — Pre-Flight Checks
Before running tests, verify the environment is clean:
```bash
npm run lint
npm run typecheck
```
If either fails, fix first. Do not run the AI test suite on a broken build — it wastes tokens and produces misleading results.

### Step 2 — Read Context
- `docs/AGENT_PROMPTS.md` — current prompt versions
- `docs/PRD.md` §14.3 — scoring weights: CS 40%, OA 35%, OM 25%
- `tests/synthetic/runner.test.ts` — expected score ranges and assertions
- `tests/synthetic/documents/` — all 7 synthetic docs

### Step 3 — Run Full Suite
```bash
npm run test:ai
```

### Step 4 — Failure Diagnosis
If any test fails, classify the failure into one of four root cause categories before attempting a fix. This prevents wasting time on the wrong layer.

| Failure Mode | Symptom | Where to Look |
|---|---|---|
| **Extraction failure** | Agent scores a present section as missing | PDF/text parsing layer — check if document text was truncated or mangled before reaching the agent |
| **Retrieval/attention failure** | Agent ignores content that exists in the document | Context window — doc may exceed token limit, or relevant section is buried. Check if agent prompt's max_tokens is too low |
| **Judgment failure** | Agent misinterprets compliant content as non-compliant (or vice versa) | Agent prompt wording — look for overly strict or ambiguous criteria in AGENT_PROMPTS.md |
| **Criteria ambiguity** | Agent flags a gap that reasonable reviewers would disagree on | Rubric definition — the element code description may need clarification, not the agent |

Do NOT skip this classification step. Fixing a judgment failure as if it were an extraction failure will not resolve the issue and may introduce new regressions.

### Step 5 — Targeted Fix
- For extraction failures: fix the parsing/text extraction layer, not the prompt
- For retrieval/attention failures: check token limits (max 3000 per pillar agent, 5000 for judge), consider whether document chunking is needed
- For judgment failures: adjust the specific agent prompt in AGENT_PROMPTS.md, then re-run ONLY the affected pillar's test cases first before full suite
- For criteria ambiguity: flag for team discussion before changing anything — do not unilaterally weaken a rubric criterion

### Step 6 — Scoped Re-Run Before Full Suite
After a targeted fix, re-run only the failing test case(s) first:
```bash
npx jest tests/synthetic/runner.test.ts -t "test_missing_conceptual"
```
Only after the scoped test passes, run the full suite to check for cross-pillar regressions:
```bash
npm run test:ai
```
This saves tokens and iteration time — a full 7-document suite run costs ~14 agent calls + 7 judge calls.

### Step 7 — Cross-Pillar Consistency Check
After all tests pass, verify:
- `test_fully_compliant` score is at least 40 points higher than `test_all_critical_gaps`
- `test_verbose_low_quality` does NOT score higher than `test_all_critical_gaps` by more than 15 points (verbosity bias check)
- `test_prompt_injection` score is NOT 100 and `anomaly_detected` is true (security check)
- No single pillar agent produces identical scores across all 7 documents (indicates the agent is not actually reading the document)

### Step 8 — Score Drift Gate
Compare current scores against the CI baseline (10-point drift threshold):
- If any document's final score drifts > 10 points from baseline, flag it
- Log before/after scores for all 7 documents even when passing — this creates a score history for tracking gradual drift across prompt versions

### Step 9 — Commit
If all tests pass:
```bash
git add tests/synthetic/baseline.json src/lib/agents/ src/lib/scoring/ src/lib/validation/schemas.ts
git commit -m "test: validate agents post-[describe change]

Score summary:
- fully_compliant: [score]
- missing_conceptual: [score]
- missing_outcomes: [score]
- missing_monitoring: [score]
- all_critical_gaps: [score]
- prompt_injection: [score]
- verbose_low_quality: [score]"
```

Include scores in the commit message body for auditability.
