# HW6 Retrospective — Custom Skill & MCP Integration

**Author:** Sandeep Samuel Jayakumar

---

## 1. How Did the Custom Skill Change Your Workflow?

Before building the `/validate-agents` skill, running the AI regression suite was a manual, error-prone process. After every change to the scoring calculator or agent prompts, I had to remember:

- Which files to read for context
- Which command to run
- How to interpret failures
- What to check after tests passed

Each run costs real money (14 agent API calls + 7 judge calls per full suite), so mistakes — like running tests on a broken build or re-running the entire suite after a one-line prompt tweak — were wasteful.

### v1 → v2 Iteration

The **v1 skill** captured the basic workflow: read context files, run `npm run test:ai`, check results, commit if green. It worked as a reference document, but it did not help me diagnose failures efficiently.

> **Example of the problem:** During one session, I spent 45 minutes adjusting a prompt when the actual root cause was the agent hitting its `max_tokens` limit and producing truncated JSON.

The **v2 iteration** addressed this directly by introducing:

| Addition | Purpose |
|---|---|
| Four-category failure taxonomy | Forces classification before any fix attempt |
| Pre-flight lint/typecheck gates | Avoids wasting API calls on broken builds |
| Scoped re-runs | Tests just the failing case before burning a full suite run |
| Cross-pillar consistency checks | Catches verbosity bias and stale-agent detection |

### Concrete Impact

What used to take **3–4 full suite runs** per debugging cycle now typically takes **1 full run + 1–2 scoped runs**. At roughly $0.15 per full suite run, this adds up across a sprint.

The failure taxonomy eliminated the guesswork. When the Outcomes Analysis agent failed schema validation because its summary exceeded 1000 characters, I immediately classified it as a **retrieval/attention failure** (output too verbose for the token/schema budget) rather than wasting time adjusting the prompt's assessment criteria.

### Tasks That Became Easier

- **Post-change validation** — One slash command instead of a mental checklist
- **Failure diagnosis** — Structured taxonomy instead of ad-hoc debugging
- **Score tracking** — Commit messages now include score summaries, creating a git-searchable history of how scores evolve across prompt iterations
- **Token cost management** — Scoped re-runs before full suite saves ~60% of API calls during iterative debugging

---

## 2. What Did MCP Integration Enable?

I connected the **Supabase MCP server** to give Claude Code direct read access to our PostgreSQL database, where Prova stores assessment results — pillar scores, gap arrays, judge outputs, and user settings.

### The Problem Before MCP

Debugging the data layer required constant context-switching:

1. Make a change in Claude Code
2. Run the test suite
3. Switch to the Supabase dashboard to inspect what actually got persisted

This was especially painful when investigating mismatches between what the orchestrator returned in-memory and what the database contained — for example, when a Zod transform silently dropped a field before insert.

### Most Useful Workflows With MCP

**1. Post-assessment inspection**
After running `npm run test:ai`, query `submission_results` to verify that persisted scores match the in-memory results. This caught a case where the `gaps` JSONB column was being truncated by a column size constraint that did not exist in the Zod schema.

**2. Score drift over time**
Querying `submission_results` filtered by model name and ordered by `created_at` gives a time-series view of how scores evolve across prompt iterations — the same data the CI drift gate checks, but queryable ad-hoc without running a separate script.

**3. Table structure verification**
Running `list_tables` confirmed that all 5 tables (`models`, `submissions`, `gaps`, `user_preferences`, `evals`) have RLS enabled — a security requirement from our `CLAUDE.md`. This is faster than navigating the Supabase dashboard's table editor.

### Key Enablement

MCP eliminated the context switch between the **"code environment"** and the **"data environment."** Everything stays in one terminal session, which reduces the cognitive overhead of debugging data-layer issues.

---

## 3. What Would I Build Next?

Three things, in priority order:

### Priority 1 — Schema Validation Hook

A pre-commit hook that automatically runs `npm run typecheck` and Zod schema validation on any changed files in `src/lib/validation/`.

This would catch schema drift (like the summary field exceeding its max length) before it reaches the test suite, saving an entire `test:ai` cycle. Claude Code hooks can trigger shell commands on specific events — this fits naturally.

### Priority 2 — `/review-scores` Skill

A read-only skill that queries the Supabase MCP to pull the latest assessment results and formats them into a comparison table against the baseline.

This would be useful for PR reviews — instead of re-running the full test suite, a reviewer could invoke `/review-scores` to see the current state of all 7 test documents without spending any API tokens.

### Priority 3 — Agent Output Sub-agents

Instead of running all three pillar agents through the orchestrator's `Promise.all`, explore using Claude Code's Agent tool to spawn each pillar assessment as an independent sub-agent.

Benefits:
- **Better isolation** — a schema failure in the OA agent would not crash the CS and OM results
- **Parallel retries** — if only one agent fails validation, retry just that agent instead of all three

---

## Summary

The common thread across all three future items: each reduces the **cost** (in time, tokens, or cognitive load) of the feedback loop between making a change and knowing whether it worked.

The custom skill and MCP integration were the first steps in that direction — they turned a manual, multi-tool debugging process into a single-command workflow with structured diagnosis. The next steps would push that further by:

- Catching issues **earlier** (pre-commit hooks)
- Enabling **cheaper verification** (read-only score queries)
- Improving **resilience** (isolated sub-agents)
