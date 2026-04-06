# Skill: validate-agents (v1)

## Description
Run the SR 11-7 synthetic test suite against the three pillar agents and judge to detect score drift, prompt regressions, and schema validation failures.

## When to Use
After any change to:
- Agent system prompts (`docs/AGENT_PROMPTS.md`)
- Scoring calculator (`src/lib/scoring/calculator.ts`)
- Orchestrator logic (`src/lib/agents/orchestrator.ts`)
- Zod schemas in `src/lib/validation/schemas.ts`

## Workflow

1. **Read context files**
   - `docs/AGENT_PROMPTS.md` — current prompt versions
   - `docs/PRD.md` §14.3 — scoring formula (CS 40%, OA 35%, OM 25%)
   - `tests/synthetic/runner.test.ts` — expected score ranges
   - `tests/synthetic/documents/` — all 7 synthetic docs

2. **Run the test suite**
   ```bash
   npm run test:ai
   ```

3. **Check for regressions**
   - All 7 documents must pass their expected score ranges
   - No score drift > 10 points from baseline
   - Zero Zod validation failures on agent outputs
   - Prompt injection doc must return `anomaly_detected: true`

4. **If failures occur**
   - Identify which document(s) failed
   - Compare current agent output to expected ranges
   - Check if prompt changes caused the drift
   - Fix the root cause and re-run

5. **Report results**
   - Print pass/fail summary for all 7 documents
   - Flag any score drift with before/after values
   - Commit if all green: `test: validate agents post-[change description]`
