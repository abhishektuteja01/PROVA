# HW5 Submission — Abhishek Tuteja

## Overview

This submission extends Claude Code with a custom skill for the Prova SR 11-7 compliance checker and integrates a Supabase MCP server for direct database access during development.

---

## Part 1: Custom Skill (50%)

### Skill Files

| File | Description |
|------|-------------|
| [`.claude/skills/validate-agents-v1.md`](../../.claude/skills/validate-agents-v1.md) | **v1 skill** — original workflow with 5 steps: read context, run tests, check regressions, fix failures, report results. No failure diagnosis framework, no pre-flight checks, no scoped re-runs. |
| [`.claude/skills/validate-agents-v2.md`](../../.claude/skills/validate-agents-v2.md) | **v2 skill (flat file)** — expanded to 9 steps with pre-flight lint/typecheck, four-category failure taxonomy, scoped re-runs, cross-pillar consistency checks, score drift gate, and score-in-commit-message convention. Includes a changelog table documenting what changed and why. |
| [`.claude/skills/validate-agents/SKILL.md`](../../.claude/skills/validate-agents/SKILL.md) | **Active slash command** — the v2 workflow registered as `/validate-agents` with proper YAML frontmatter (`name`, `description`). This is the file Claude Code resolves when the user types `/validate-agents`. |

### v1 to v2 Iteration Summary

| Change | Problem That Prompted It |
|--------|--------------------------|
| Pre-flight lint/typecheck | Ran test:ai on a broken build, wasting 21 agent API calls |
| Four failure-mode taxonomy | Spent 45 min adjusting a prompt when the real issue was max_tokens truncation |
| Scoped re-run before full suite | Full suite re-runs after small fixes burned tokens unnecessarily |
| Cross-pillar consistency check | Verbosity bias went undetected by individual test assertions |
| Score drift gate | Cumulative 18-point drift across 4 edits, each individually within tolerance |
| Scores in commit messages | No git-searchable history of score evolution across prompt versions |

### Screenshots

| File | What It Shows |
|------|---------------|
| [skill_v1_Attempt.png](skill_v1_Attempt.png) | `/validate-agents` invoked before the skill was properly registered — returns "Unknown skill", demonstrating the v1 state |
| [skill_v2_Attempt.png](skill_v2_Attempt.png) | `/validate-agents` successfully resolving and executing the v2 workflow — pre-flight checks, full test suite run, 10/10 passing results |

### Real Tasks the Skill Was Tested On

1. **Scoring calculator token limit fix** — agents were hitting `max_tokens: 1500` and producing truncated JSON. The skill's failure taxonomy classified this as a retrieval/attention failure, leading to the fix (bumping to 3000/5000 tokens + adding prompt-level character constraints). Result: 9/10 then 10/10 passing.

2. **Judge agent truncation fix** — the judge was producing verbose `issues` arrays that exceeded its token budget, causing invalid JSON. Scoped re-run on the failing test confirmed the fix before a full suite run. Result: 10/10 passing.

---

## Part 2: MCP Integration (35%)

### Configuration

| File | Description |
|------|-------------|
| [`.mcp.json`](../../.mcp.json) | MCP server configuration — connects to the project's Supabase instance via HTTP |
| [`.claude/skills/MCP_SETUP.md`](../../.claude/skills/MCP_SETUP.md) | Setup documentation — install command, verification steps, 4 workflow examples (post-assessment inspection, score drift comparison, gap analysis debugging, RLS policy verification), and security notes |

### Demonstrated Workflow

| File | What It Shows |
|------|---------------|
| [MCP_Supabase_run.png](MCP_Supabase_run.png) | `list_tables` query via Supabase MCP returning all 5 Prova tables (models, submissions, gaps, user_preferences, evals) with RLS status and row counts |

### What the MCP Server Enables

- Query assessment results directly from Claude Code without switching to the Supabase dashboard
- Verify RLS policies are enabled on all tables
- Inspect persisted gap arrays and pillar scores after test runs
- Compare scores across runs for drift detection

---

## Part 3: Retrospective (15%)

| File | Description |
|------|-------------|
| [Abhishek_Retrospective.md](Abhishek_Retrospective.md) | 1.5-page retrospective covering: (1) how the skill changed the workflow and reduced debugging cost, (2) how MCP eliminated context-switching between code and database, (3) next steps — pre-commit hooks, `/review-scores` skill, sub-agent isolation |

---

## Repository Structure

```
.claude/
  skills/
    validate-agents/
      SKILL.md                  # Active /validate-agents slash command
    validate-agents-v1.md       # v1 for iteration evidence
    validate-agents-v2.md       # v2 flat file for iteration evidence
    MCP_SETUP.md                # MCP setup documentation
  settings.local.json
.mcp.json                       # Supabase MCP server config
hw-docs/
  Abhishek- hw5/
    SUBMISSION.md               # This file
    Abhishek_Retrospective.md   # Part 3 retrospective
    skill_v1_Attempt.png        # Part 1 screenshot
    skill_v2_Attempt.png        # Part 1 screenshot
    MCP_Supabase_run.png        # Part 2 screenshot
```
