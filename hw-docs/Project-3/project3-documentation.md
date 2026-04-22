# Project 3: Production Application with Claude Code Mastery

**Project:** Prova — SR 11-7 Model Documentation Compliance Checker

**Repository:** https://github.com/abhishektuteja01/PROVA

**Partner:** [Derek Zhang](https://github.com/DerekZ-113) and [Sandeep Samuel Jayakumar](https://github.com/ssjayakumar)

**Deployed URL:** https://getprova.vercel.app

---

## What is Prova?

SR 11-7 compliance checker for AI model documentation. Users upload a model doc (PDF or DOCX) → three parallel Claude agents assess it against SR 11-7 pillars → a judge agent validates → compliance score (0–100) + PDF report generated.

---

## Requirements

### Functional Requirements

- **Real problem:** Junior model validators spend 3–4 hours manually checking model docs against SR 11-7 with paper checklists; Prova automates this to minutes with parallel AI agents and consistent scoring (see `docs/PRD.md` for full problem statement)
- **3 user personas / distinct feature areas:** (1) Junior Validator — upload docs, get gap analysis with element codes and severity levels; (2) Model Risk Manager — portfolio dashboard with compliance scores, model inventory, audit trails; (3) Model Developer — pre-submission feedback to avoid rejection cycles (see `docs/PRD.md` personas)
- **Real-world use case:** SR 11-7 is a real federal regulation governing model risk at banks — no existing tool automates element-level compliance checking with AI agents
- **Production quality:** TypeScript strict, Sentry error monitoring, RLS on all tables, CI/CD pipeline, PDF report generation, mobile-responsive UI (see `docs/UI_DESIGN.md`)
- Deployed and accessible via public URL: [https://getprova.vercel.app](https://getprova.vercel.app)

### Technical Requirements

#### Architecture

- **Framework:** Next.js full-stack application (App Router)
- **Database:** PostgreSQL via Supabase (RLS on all tables)
- **Authentication:** Supabase Auth (JWT, session verification on all API routes)
- **Deployment:** Vercel (preview deploys on PR, production deploy on merge to main)

#### Claude Code Mastery (core of this project)

Each of the following Claude Code concepts is demonstrated with evidence in the repository:

##### CLAUDE.md & Memory (W10)

**Comprehensive CLAUDE.md with @imports**

Root `CLAUDE.md` imports 10 folder-level context files using `@imports` syntax. Each sub-file contains domain-specific rules, keeping the root file under 70 lines while the full context is available on demand.

```
@src/lib/agents/CLAUDE.md
@src/lib/anthropic/CLAUDE.md
@src/lib/scoring/CLAUDE.md
@src/lib/validation/CLAUDE.md
@src/lib/security/CLAUDE.md
@src/lib/errors/CLAUDE.md
@src/app/api/CLAUDE.md
@src/components/CLAUDE.md
@src/components/compliance/CLAUDE.md
@src/components/dashboard/CLAUDE.md
```

**CLAUDE.md Evolution** — visible in git history:
- Initial CLAUDE.md created at project start (scaffold/initial-setup branch)
- Sub-folder CLAUDE.mds added as each feature area was built (Sprint 1–3 branches)
- @imports syntax + 10th file (`src/lib/anthropic/CLAUDE.md`) added in `feat/claude-code-mastery` (commit `748b026`)
- Bloat removed from components/compliance/dashboard sub-files in same commit

**Auto-memory usage:** 5 memory files in `.claude/memory/`, accumulated across sprints:
- `user_role.md` — project context and collaboration preferences (Sprint 1)
- `project_agent_architecture.md` — why three pillars + judge, not a single agent (Sprint 1 decision)
- `feedback_scoring_trust.md` — never trust agent-reported scores, always recalculate from gaps (Sprint 2 lesson)
- `feedback_no_direct_main.md` — no direct commits to main, enforced after Sprint 1 incident
- `reference_project_docs.md` — quick-reference index of which doc covers what (accumulated over time)
- Index: `.claude/memory/MEMORY.md`

**Project conventions documented:**
- Architecture decisions in `docs/ARCHITECTURE.md`
- Agent prompts in `docs/AGENT_PROMPTS.md`
- Scoring formula in `docs/SCORING.md`
- Database schema in `docs/DATABASE.md`
- All non-negotiable rules in root `CLAUDE.md`

##### Custom Skills (W12) — minimum 2

**Skill 1: `validate-agents`** — `.claude/skills/validate-agents/SKILL.md`

Runs the SR 11-7 synthetic test suite against all pillar agents and the judge. Used after every agent prompt or scoring change. Includes pre-flight checks, failure diagnosis, targeted fixes, and scoped re-runs.

Trigger: after changes to agent prompts, scoring calculator, orchestrator logic, or schemas.

**Skill 2: `implement-feature`** — `.claude/skills/implement-feature/SKILL.md`

Implements any GitHub issue in the repo end-to-end: reads issue via `gh issue view {N}`, loads relevant context, plans (for medium/large issues), splits backend/frontend if needed, verifies with lint + typecheck + build + test, commits with conventional messages, opens PR.

**Skill iteration (v1 → v2):**

| Change | Problem That Prompted It |
|--------|--------------------------|
| Plan-before-execute | Data shape mismatch on S2-06 caught too late |
| Backend/frontend split | 500+ line diffs caused review fatigue |
| Lint pre-commit | PRs #52 and #53 failed CI for lint errors build didn't catch |
| Conflict-aware doc updates | `prova-github-issues.md` caused merge conflicts on S2-07, S3-04, S3-06 |
| Parallel execution awareness | Sequential runs wasted ~40 minutes vs parallel |

Full iteration log: `.claude/skills/ITERATION_LOG.md`

**Team usage evidence:**
- Abhishek: `validate-agents` v1 fail → v2 pass (10/10) — see `hw-docs/Abhishek- hw5/skill_v1_Attempt.png` and `skill_v2_Attempt.png`
- Sandeep: `validate-agents` v1 fail → v2 pass (10/10) — see `hw-docs/sandeep- hw5/skill_v1_Attempt.png` and `skill_v2_Attempt.png`
- Derek: `implement-feature` used across 11 tasks (S2-06 through S3-06), v1 → v2 iteration documented — see `hw-docs/Derek-hw5/hw5-submission.md`

##### Hooks (W12) — minimum 2

Configured in `.claude/settings.json`:

**Hook 1 — PreToolUse (safety gate):**
Fires before every Bash command. Checks if current branch is `main` AND the command contains `git commit` or `git push`. If both true → exits 1, blocks the command, prints error message. Enforces the "no direct commits to main" rule at the tooling level.

**Hook 2 — PostToolUse (quality enforcement):**
Fires after every `Edit` or `Write` tool call. If the modified file is `.ts` or `.tsx`, automatically runs `npm run typecheck` and surfaces the last 5 lines of output. Quality gate on every TypeScript change without manual intervention.

**Hook 3 — Stop (test gate):**
Fires when Claude Code is about to finish responding. Runs `npm test` and surfaces the last 20 lines of output. If tests fail (exit code non-zero), Claude Code sees the failure and continues working to fix it instead of stopping. Ensures no session ends with broken tests.

##### MCP Servers (W12) — minimum 1

**Supabase MCP** — configured in `.mcp.json` (committed to repo):

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=mnckmhwcmmjxakaekefl"
    }
  }
}
```

Used for: querying the database directly during development, inspecting table schemas, validating RLS policies, checking submission records during debugging.

Setup notes: `.claude/skills/MCP_SETUP.md`

**Evidence of use:** Supabase MCP queried to list all tables, RLS status, and row counts — see `hw-docs/Abhishek- hw5/MCP_Supabase_run.png` (shows 5 tables: models, submissions, gaps, user_preferences, evals — all with RLS enabled)

##### Agents (W12-W13) — minimum 1

**Sub-agent: `security-reviewer`** — `.claude/agents/security-reviewer.md`

Reviews changed files against Prova's security rules before a PR. Checks:
- API key isolation (`ANTHROPIC_API_KEY`, `SUPABASE_SECRET_KEY`)
- Authentication — session verification on all API routes
- Prompt injection — `<document>` delimiter usage in agents
- Input sanitization — no `dangerouslySetInnerHTML`, no hardcoded hex
- File upload safety — MIME + extension validation, memory-only
- Zod validation coverage on all API boundaries

Outputs findings as CRITICAL / WARNING / PASS with file + line references.

**Evidence of use:** Security audit run on `feat/security-audit` branch (git worktree). Findings committed to `docs/security-audit.md`. PR #73.

##### Parallel Development (W12)

**Worktree setup:**
```
/Users/abhishektuteja/Desktop/Code Projects/prova          [main]
/Users/abhishektuteja/Desktop/Code Projects/prova-security [feat/security-audit]
```

`git worktree list` shows both branches checked out simultaneously with different commit hashes (`8dbec9e` on main, `9fbf85f` on feat/security-audit).

**2 features developed in parallel:**
1. `feat/security-audit` — security reviewer agent audit (worktree: `prova-security`)
2. `feat/s3-05-ai-regression` — AI regression test suite (worktree: `prova-tests`)

Both branches were active simultaneously during Sprint 3. Security audit ran in the worktree while AI test infrastructure was built on the main checkout. Merged via PRs #73 and #68 respectively.

##### Writer/Reviewer Pattern + C.L.E.A.R. (W12)

**PR #72 — feat/claude-code-mastery** (writer: Claude Code, reviewer: Abhishek)
- C.L.E.A.R. framework in PR body: Context (token-efficient @imports), Logic (how imports work), Edge Cases (python3 dependency in hook), Alternatives (kept table vs dropped it), Review Focus (hook logic, skill triggers)
- AI disclosure: ~85% AI-generated, Claude Code (claude-sonnet-4-6), human verified hook logic and skill triggers
- Review comment with C.L.E.A.R. structure posted on PR

**PR #73 — feat/security-audit** (writer: security-reviewer agent, reviewer: Abhishek)
- C.L.E.A.R. framework in PR body: Context (worktree audit), Logic (six control areas), Edge Cases (all passed), Alternatives (inline vs worktree audit), Review Focus (findings vs source)
- AI disclosure: ~90% AI-generated, Claude Code + security-reviewer sub-agent, human cross-checked findings

**PR template** — `.github/pull_request_template.md` auto-populates C.L.E.A.R. sections + AI disclosure table for every future PR.

#### Test-Driven Development (W11)

**TDD cycle 1 — Zod validation schemas:**
- Red: commit `674d539` — failing tests for `loginSchema`, `signupSchema`, `documentUploadSchema`
- Green: commit `b8a6a17` — schemas implemented, tests pass
- Refactor: commits `e520b9f`, `3a275fe` — tests updated for `document_text` pattern and new token/schema limits

**TDD cycle 2 — Security utilities (`validateFileMagicBytes`):**
- Red: commit `d6470e1` — failing tests for PDF/DOCX magic byte validation
- Green: commit `5296c33` — assertions fixed, tests pass
- Refactor: commit `139e404` — extracted buffer factories, added edge cases (truncated buffer, type mismatch)

**TDD cycle 3 — Scoring (`deriveStatus`) + agent errors:**
- Red: commit `d6470e1` — failing tests for `deriveStatus` boundary values and `AgentParseError/AgentSchemaError`
- Green: commit `5296c33` — implementations pass all assertions
- Refactor: commit `139e404` — converted to table-driven tests, added cross-class instanceof checks

All three cycles visible in PR #71 (`feat/tdd-coverage-evidence`).

**Coverage:** 70% threshold enforced across lines, functions, branches, and statements — configured in `jest.config.ts` (commit `151c273`). Run via `npm run test:coverage`.

**E2E tests:** Playwright tests in `tests/e2e/auth.spec.ts` (commit `151c273`) — signup page rendering, form fields, submit button, Google sign-up button, login link navigation.

#### CI/CD Pipeline (W14) — GitHub Actions

GitHub Actions workflows in `.github/workflows/`:

| Stage | File | Status |
|-------|------|--------|
| Lint (ESLint) | `pr.yml` | Passing |
| Type checking (`tsc --noEmit`) | `pr.yml` | Passing |
| Unit + integration tests | `pr.yml` | Passing |
| E2E tests (Playwright) | `pr.yml` | Passing |
| Security scan (Gitleaks) | `pr.yml` | Passing |
| AI PR review (`claude-code-action`) | `ai-review.yml` | Passing |
| Preview deploy (Vercel) | `deploy.yml` | Passing |
| Production deploy on merge to main | `deploy.yml` | Passing |
| `npm audit` dependency scan | `pr.yml`, `deploy.yml` | Passing |

#### Security (W14) — minimum 4 gates from the 8-gate pipeline

| Gate | Status |
|------|--------|
| Pre-commit secrets detection (Gitleaks) | Done — in CI (`pr.yml`) |
| Dependency scanning (`npm audit`) | Done — `npm audit --audit-level=moderate` in `pr.yml` and `deploy.yml` |
| SAST / security sub-agent (`security-reviewer`) | Done — `.claude/agents/security-reviewer.md` |
| Security acceptance criteria in Definition of Done | Done — PR template checkbox: "Security reviewed (if touching API routes, agents, or file handling)" |
| OWASP Top 10 awareness in CLAUDE.md | Done — `src/lib/security/CLAUDE.md` OWASP Top 10 section mapping all 10 categories to Prova controls |
| API key isolation | Done — enforced in code + CLAUDE.md |
| RLS on all database tables | Passing |
| Input sanitization + prompt injection protection | Passing |

### Team Process

**Sprint 1** (SR 11-7 core): Auth, Zod schemas, file parsing, Anthropic SDK, compliance route
**Sprint 2** (Features): Parallel agents, scoring, dashboard, submissions, PDF report, settings
**Sprint 3** (Production): CI/CD, AI regression tests, security hardening, unit tests, help page

**Sprint planning docs:**
- Sprint 1: `hw-docs/Project-3/sprint-1-planning.md` — 8 issues split Abhishek (auth, agents, compliance) + Sandeep (schemas, sanitization, DB, landing page)
- Sprint 2: `hw-docs/Project-3/sprint-2-planning.md` — 8 issues split Abhishek (agents, orchestration) + Sandeep (scoring, dashboard) + Derek (submissions, PDF, settings)
- Sprint 3: `hw-docs/Project-3/sprint-3-planning.md` — 6 issues split Derek (CI/CD, security, AI tests, help page) + Abhishek (Sentry, hardening, Claude Code mastery) + Sandeep (TDD/coverage)

**Sprint retrospectives:**
- Sprint 1: `hw-docs/Project-3/sprint-1-retro.md` — direct-push-to-main incident, no CI yet, action items led to hook + branch protection
- Sprint 2: `hw-docs/Project-3/sprint-2-retro.md` — 500+ line diff problem, merge conflicts, no automated tests yet, action items led to Sprint 3 CI/TDD focus
- Sprint 3: `hw-docs/Project-3/sprint-3-retro.md` — PDF parsing pain (pdf-parse → unpdf), CI caught Sprint 2 lint debt, worktree parallelism worked well

**GitHub Issues:** Branch-per-issue workflow evidenced by 30+ branches (`feat/s1-03`, `feat/s2-01` through `feat/s3-06`, etc.)

**Issues with acceptance criteria:**
- [S2-01 (#21)](https://github.com/abhishektuteja01/PROVA/issues/21) — parallel agent system with exact file specs, orchestrator pseudocode, retry logic, and Zod validation requirements
- [S3-02 (#30)](https://github.com/abhishektuteja01/PROVA/issues/30) — AI regression suite with 7 synthetic documents, expected score ranges per document, and drift threshold (>10 pts = fail)
- [S3-04 (#32)](https://github.com/abhishektuteja01/PROVA/issues/32) — security hardening with testable checklist: API session verification, rate limit 429 shape, prompt injection test, file upload rejection, RLS isolation, zero `dangerouslySetInnerHTML`

**Async standups:** `hw-docs/Project-3/async-standups.md` — 3 standups per sprint (9 total), all partners reporting. Format: Did / Doing / Blockers.

**Peer evaluations:** Submitted via course form.

---

## Deliverables

| Deliverable | Status |
|-------------|--------|
| GitHub repository with full `.claude/` config | Done github.com/abhishektuteja01/PROVA |
| Deployed application | Done [https://getprova.vercel.app](https://getprova.vercel.app) |
| CI/CD pipeline (all stages passing) | Done All 9 stages passing (see CI/CD section above) |
| Technical blog post | Done [https://medium.com/@atutejawork/why-our-ai-agents-kept-lying-about-their-scores-316e3fe186f7](https://medium.com/@atutejawork/why-our-ai-agents-kept-lying-about-their-scores-316e3fe186f7) |
| Video demonstration (5–10 min) | Done [https://www.youtube.com/watch?v=4IQsjyuxNeQ](https://www.youtube.com/watch?v=4IQsjyuxNeQ) |
| Individual reflection — Abhishek (500 words) | Done `hw-docs/Project-3/reflection-abhishek.md` |
| Individual reflection — Sandeep (500 words) | Done `hw-docs/Project-3/reflection-sandeep.md` |
| Individual reflection — Derek (500 words) | Done `hw-docs/Project-3/reflection-derek.md` |
| Showcase Google Form submission | Done Submitted |
