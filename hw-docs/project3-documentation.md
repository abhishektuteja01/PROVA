# Project 3: Production Application with Claude Code Mastery

**Project:** Prova — SR 11-7 Model Documentation Compliance Checker
**Repository:** https://github.com/abhishektuteja01/PROVA
**Partner:** [PLACEHOLDER — partner name and GitHub handle]
**Deployed URL:** [PLACEHOLDER — Vercel production URL]

---

## What is Prova?

SR 11-7 compliance checker for AI model documentation. Users upload a model doc (PDF or DOCX) → three parallel Claude agents assess it against SR 11-7 pillars → a judge agent validates → compliance score (0–100) + PDF report generated.

---

## Claude Code Mastery Evidence

### CLAUDE.md & Memory (W10)

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

**Auto-memory usage:** [PLACEHOLDER — add evidence of `.claude/memory/` usage or session where Claude recalled persistent context across sessions]

**Project conventions documented:**
- Architecture decisions in `docs/ARCHITECTURE.md`
- Agent prompts in `docs/AGENT_PROMPTS.md`
- Scoring formula in `docs/SCORING.md`
- Database schema in `docs/DATABASE.md`
- All non-negotiable rules in root `CLAUDE.md`

---

### Custom Skills (W12)

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

**Team usage evidence:** [PLACEHOLDER — session logs or screenshots showing both partners invoking skills]

---

### Hooks (W12)

Configured in `.claude/settings.json`:

**Hook 1 — PreToolUse (safety gate):**
Fires before every Bash command. Checks if current branch is `main` AND the command contains `git commit` or `git push`. If both true → exits 1, blocks the command, prints error message. Enforces the "no direct commits to main" rule at the tooling level.

**Hook 2 — PostToolUse (quality enforcement):**
Fires after every `Edit` or `Write` tool call. If the modified file is `.ts` or `.tsx`, automatically runs `npm run typecheck` and surfaces the last 5 lines of output. Quality gate on every TypeScript change without manual intervention.

**Stop hook:** [PLACEHOLDER — add a Stop hook that runs `npm test` at end of session, configured in settings.json]

---

### MCP Servers (W12)

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

**Evidence of use:** [PLACEHOLDER — screenshot or session log showing Supabase MCP tool call in a Claude Code session]

---

### Agents (W12–W13)

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

---

### Parallel Development (W12)

**Worktree setup:**
```
/Users/abhishektuteja/Desktop/Code Projects/prova          [main]
/Users/abhishektuteja/Desktop/Code Projects/prova-security [feat/security-audit]
```

`git worktree list` shows both branches checked out simultaneously with different commit hashes (`8dbec9e` on main, `9fbf85f` on feat/security-audit).

**2 features developed in parallel:** [PLACEHOLDER — add a second worktree branch with a real feature developed simultaneously. Current evidence shows 1 worktree branch (security audit). Need a second feature branch developed in parallel with evidence in git history.]

---

### Writer/Reviewer Pattern + C.L.E.A.R. (W12)

**PR #72 — feat/claude-code-mastery** (writer: Claude Code, reviewer: Abhishek)
- C.L.E.A.R. framework in PR body: Context (token-efficient @imports), Logic (how imports work), Edge Cases (python3 dependency in hook), Alternatives (kept table vs dropped it), Review Focus (hook logic, skill triggers)
- AI disclosure: ~85% AI-generated, Claude Code (claude-sonnet-4-6), human verified hook logic and skill triggers
- Review comment with C.L.E.A.R. structure posted on PR

**PR #73 — feat/security-audit** (writer: security-reviewer agent, reviewer: Abhishek)
- C.L.E.A.R. framework in PR body: Context (worktree audit), Logic (six control areas), Edge Cases (all passed), Alternatives (inline vs worktree audit), Review Focus (findings vs source)
- AI disclosure: ~90% AI-generated, Claude Code + security-reviewer sub-agent, human cross-checked findings

**PR template** — `.github/pull_request_template.md` auto-populates C.L.E.A.R. sections + AI disclosure table for every future PR.

---

## Test-Driven Development (W11)

**TDD cycle 1 — Zod validation schemas:**
- Red: commit `674d539` — failing tests for `loginSchema`, `signupSchema`, `documentUploadSchema`
- [PLACEHOLDER — green and refactor commits for this cycle]

**TDD cycle 2 — Utility functions:**
- Red: commit `d6470e1` — failing tests for `validateFileMagicBytes`, `deriveStatus`, `AgentParseError/AgentSchemaError`
- Green: commit `5296c33` — assertions fixed, tests pass
- Refactor: commit `139e404` — tests cleaned up

**TDD cycle 3:** [PLACEHOLDER — third red→green→refactor cycle needed. Pick a feature area (e.g., scoring calculator, rate limiter) and commit failing tests before implementation.]

**Coverage:** 70% threshold configured (`151c273`). [PLACEHOLDER — add current coverage report or CI badge showing ≥70%.]

**E2E tests:** Signup flow covered (`151c273`). [PLACEHOLDER — add 1-2 more E2E scenarios (login, compliance check submission) and confirm Playwright CI stage passes.]

---

## CI/CD Pipeline (W14)

GitHub Actions workflows in `.github/workflows/`:

| Stage | File | Status |
|-------|------|--------|
| Lint (ESLint) | `pr.yml` | ✅ |
| Type checking (`tsc --noEmit`) | `pr.yml` | ✅ |
| Unit + integration tests | `pr.yml` | ✅ |
| E2E tests (Playwright) | `pr.yml` | ✅ |
| Security scan (Gitleaks) | `pr.yml` | ✅ |
| AI PR review (`claude-code-action`) | `ai-review.yml` | ✅ |
| Preview deploy (Vercel) | `deploy.yml` | ✅ |
| Production deploy on merge to main | `deploy.yml` | ✅ |
| `npm audit` dependency scan | [PLACEHOLDER — add npm audit step to pr.yml] | ⬜ |

---

## Security (W14)

| Gate | Status |
|------|--------|
| Pre-commit secrets detection (Gitleaks) | ✅ — in CI (`pr.yml`) |
| Dependency scanning (`npm audit`) | [PLACEHOLDER] |
| SAST / security sub-agent (`security-reviewer`) | ✅ — `.claude/agents/security-reviewer.md` |
| Security acceptance criteria in Definition of Done | [PLACEHOLDER — add to CLAUDE.md or PR template] |
| OWASP Top 10 awareness in CLAUDE.md | [PLACEHOLDER — add OWASP section to root CLAUDE.md or src/lib/security/CLAUDE.md] |
| API key isolation | ✅ — enforced in code + CLAUDE.md |
| RLS on all database tables | ✅ |
| Input sanitization + prompt injection protection | ✅ |

---

## Team Process

**Sprint 1** (SR 11-7 core): Auth, Zod schemas, file parsing, Anthropic SDK, compliance route
**Sprint 2** (Features): Parallel agents, scoring, dashboard, submissions, PDF report, settings
**Sprint 3** (Production): CI/CD, AI regression tests, security hardening, unit tests, help page

**Sprint planning docs:** [PLACEHOLDER — add sprint planning notes for Sprint 1 and Sprint 2]
**Sprint retrospectives:** [PLACEHOLDER — add retrospective docs for Sprint 1 and Sprint 2]

**GitHub Issues:** Branch-per-issue workflow evidenced by 30+ branches (`feat/s1-03`, `feat/s2-01` through `feat/s3-06`, etc.)

**Issues with acceptance criteria:** [PLACEHOLDER — link to 2-3 GitHub issues showing testable acceptance criteria in the issue body]

**Async standups:** [PLACEHOLDER — minimum 3 per sprint per partner. Add standup log or link to Slack/Notion thread.]

**Peer evaluations:** [PLACEHOLDER — submit via course form]

---

## Deliverables

| Deliverable | Status |
|-------------|--------|
| GitHub repository with full `.claude/` config | ✅ github.com/abhishektuteja01/PROVA |
| Deployed application | [PLACEHOLDER — Vercel URL] |
| CI/CD pipeline (all stages passing) | ✅ (except npm audit — see above) |
| Technical blog post | [PLACEHOLDER — Medium/dev.to URL] |
| Video demonstration (5–10 min) | [PLACEHOLDER — YouTube/Loom URL] |
| Individual reflection — Abhishek (500 words) | [PLACEHOLDER] |
| Individual reflection — Partner (500 words) | [PLACEHOLDER] |
| Showcase Google Form submission | [PLACEHOLDER] |
