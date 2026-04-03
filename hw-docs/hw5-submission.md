# HW5: Custom Skill + MCP Integration

**Derek Zhang** | Prova — SR 11-7 Model Documentation Compliance Checker
**Repository:** [github.com/abhishektuteja01/PROVA](https://github.com/abhishektuteja01/PROVA)

---

## Part 1: Custom Skill — `implement-feature`

### Overview

The `implement-feature` skill automates implementing GitHub issues from the Prova issue spec (`docs/prova-github-issues.md`). It was refined across 11 feature implementations (S2-06 through S3-06) and iterated from a basic v1 to a production-quality v2.

**Skill files:** `.claude/skills/implement-feature-v1.md` and `.claude/skills/implement-feature-v2.md`

---

### v1: Basic Workflow

The initial skill captured a straightforward workflow:

1. **Read the Issue** — Find the issue in the spec by ID, read the full spec
2. **Read Context Files** — Load the relevant CLAUDE.md files and source files based on task type (API work, frontend, agents, etc.)
3. **Implement** — Follow codebase conventions: TypeScript strict, Zod schemas in `schemas.ts` only, `errorResponse()` for errors, `createServerClient()` for reads, CSS variables for colors, skeleton loading only
4. **Verify** — Run `npm run build` and `npm run typecheck`
5. **Commit and Push** — Feature branch, conventional commit, update issue tracker

v1 worked but had problems that surfaced during real usage.

---

### v2: Evolved Workflow

v2 incorporated 7 specific improvements, each driven by a real problem encountered during the project:

**1. Plan-Before-Execute** — Complex issues use `plan` mode first. On S2-06, the planning step caught a data shape mismatch between `ComplianceResults` (expects `ComplianceResponse`) and the submission detail API (returns `SubmissionDetail`). This was caught before a single line of code was written.

**2. Backend/Frontend Split** — Issues with both API routes and UI pages are implemented in two focused runs (~200-250 lines each instead of 500+). This directly addressed review fatigue during large diffs.

**3. Lint/Typecheck Pre-Commit** — v1 only ran `npm run build`. After CI was added (S3-01), lint errors that build didn't catch caused PR #52 and #53 to fail. v2 mandates `lint + typecheck + build` before every commit. Zero CI failures since.

**4. Conflict-Aware Doc Updates** — `docs/prova-github-issues.md` caused merge conflicts on 3 separate occasions when multiple branches updated it. v2 commits doc updates separately and provides manual merge guidance (never blindly accept-current or accept-incoming).

**5. Conventional Commit Messages** — `feat(S2-06):`, `fix:`, `test(S3-05):`, `security(S3-04):`, `ci(S3-01):` prefixes for traceable git history.

**6. Parallel Execution Awareness** — Identifies independent issues that can run simultaneously (e.g., S3-04 + S3-05 saved ~40 minutes running in parallel).

**7. CI-First Mindset** — After CI caught a missing `ts-node` dependency and lint errors on main, v2 includes: fix main first if CI fails due to shared issues, then rebase all open branches.

---

### Iteration Evidence

| Change | Problem That Prompted It | Evidence |
|--------|-------------------------|----------|
| Plan-before-execute | Data shape mismatch on S2-06 | Plan review caught ComplianceResults vs SubmissionDetail before coding |
| Backend/frontend split | 500+ line diffs hard to review | S2-06 split into Run 1 (4 routes, ~200 lines) + Run 2 (2 pages, ~250 lines) |
| Lint pre-commit | PRs #52 and #53 failed CI | Required separate fix PR (#54), then rebase both branches (~30 min rework) |
| Conflict-aware docs | Merge conflicts on S2-07, S3-04, S3-06 | Each required manual resolution combining statuses from both sides |
| Parallel execution | Sequential runs wasted time | S3-04+S3-05 and S3-01+S3-06 ran in parallel, saved ~40 minutes |

### Tasks Executed

- **v1:** S2-06 Backend (1 task)
- **v2:** S2-06 Frontend, S2-07, S2-08, S3-01, S3-02, S3-04, S3-05, S3-06 (10 tasks)

### Metrics

- Issues completed with v1: 1 | Issues completed with v2: 10
- CI failures from v1 patterns: 2 | CI failures from v2 patterns: 0
- Time saved by parallel execution: ~40 minutes

---

## Part 2: MCP Integration — GitHub MCP Server

### Why GitHub MCP?

Throughout development, GitHub operations were performed manually: closing issues, creating PRs with descriptions, checking CI status, managing branches. GitHub MCP allows Claude Code to perform these operations directly during the `implement-feature` workflow.

### Setup

**1. Install the GitHub MCP Server:**
```bash
claude mcp add github -- npx -y @modelcontextprotocol/server-github
```

**2. Configure authentication:**
```bash
# Uses existing GitHub CLI authentication
export GITHUB_PERSONAL_ACCESS_TOKEN=$(gh auth token)
```

**3. Verify in Claude Code:**
```
List all open issues in the abhishektuteja01/PROVA repository
```

**Setup documentation:** `.claude/skills/MCP_SETUP.md`

### Demonstrated Workflow: End-of-Sprint Project Health Check

I asked Claude Code to perform a full project status audit using the GitHub MCP:

> "List all open issues and open PRs in abhishektuteja01/PROVA. For each, check if it's already completed. Close any completed issues. Give me a full project summary."

**Result:**

| Category | Count |
|----------|-------|
| Total issues | 22 (all closed) |
| Total PRs | 22 (all closed & merged) |
| Open issues | 0 |
| Open PRs | 0 |

Sprint breakdown:
- Sprint 1 (S1-01 → S1-08): 8 issues — all Done & closed
- Sprint 2 (S2-01 → S2-08): 8 issues — all Done & closed
- Sprint 3 (S3-01 → S3-06): 6 issues — all Done & closed

The repo is fully caught up: every issue from the spec has been implemented, merged, and closed.

![Claude Code MCP Demo — GitHub project health check](mcp%20demo.png)

### What MCP Enables

**Without MCP:**
- Push code → switch to GitHub UI → manually create PR → copy-paste description → manually close issues
- CI fails → switch to GitHub UI → click into failing run → read logs → switch back to Claude Code

**With MCP:**
- Push code → Claude Code creates PR with correct closing keyword → monitors CI → all in one session
- End-of-sprint cleanup (closing issues, checking PRs) becomes a single Claude Code conversation

### How MCP Enhances the Skill

The v2 skill's Step 9 (Push and PR) requires manually creating a PR. With GitHub MCP, Claude Code can push the branch AND create the PR — closing the loop so the entire workflow from "read issue" to "PR ready for review" happens in a single session.

---

## Part 3: Retrospective

### How the Custom Skill Changed My Workflow

The `implement-feature` skill formalized a workflow that evolved organically across 11 feature implementations. Before creating it, every Claude Code session started with me re-explaining the same context: read the issue spec, follow the CLAUDE.md conventions, use `errorResponse()` for errors, put schemas in `schemas.ts`, commit to a feature branch. I was copying and pasting the same boilerplate every time.

The v1 skill captured the baseline — read issue, implement, build, commit, push. It worked, but it was a single-run approach that produced large diffs. When I implemented S2-06 (Submission History), the output was 4 API routes + 2 pages + a modal in one massive diff. Reviewing that in one sitting was overwhelming — I have ADHD, and after carefully reviewing the first two API routes, my attention would drift and I'd start rubber-stamping the rest.

The v2 skill addressed this directly with the backend/frontend split. Issues with both API routes and UI pages get implemented in two focused runs. Each diff is 200-250 lines instead of 500+, and each review session has a clear scope. This single change was the most impactful improvement to my workflow.

The plan-before-execute step was the second biggest win. On S2-06's frontend run, planning caught a data shape mismatch between what `ComplianceResults` expected and what the API returned. Without planning, Claude Code would have either faked the data or built the wrong abstraction. The plan review caught it before any code was written.

The lint pre-commit check was a lesson learned the hard way. After adding CI in S3-01, both that PR and S3-06 failed because lint errors existed on main that `npm run build` didn't catch. We had to create a separate fix PR, merge it, then rebase both branches. Since adding that rule to v2, zero CI failures from lint issues.

**Tasks that became easier:**
- Full-stack features — the split pattern removes decision fatigue
- Sprint cleanup — conventional commits and doc update patterns make merges predictable
- Onboarding new issues — instead of re-explaining conventions, point Claude Code at the skill

### What MCP Integration Enabled

GitHub MCP gave Claude Code direct access to the repository's issues, PRs, and CI status without leaving the terminal.

The most immediate value was end-of-sprint cleanup. Manually closing issues and checking PR status meant opening GitHub in a browser, clicking through each issue, verifying it was done, closing with a comment. With MCP, one command replaced 10 minutes of clicking through GitHub's UI.

The deeper value is closing the loop in the workflow. The v2 skill's final step requires switching to the GitHub UI to create the PR. With MCP, the entire workflow from "read issue" to "PR created" happens in a single Claude Code session.

### What I Would Build Next

**A `/fix-ci` skill.** We hit CI failures 3 times — lint errors, missing `ts-node`, broken test files from an interrupted session. Each followed the same pattern: read logs, identify failure, fix, push, verify. Combined with GitHub MCP (to read failure logs), this skill could diagnose and fix most CI failures in a single session.

**A `/review-pr` skill.** Pull the PR diff via GitHub MCP, check against CLAUDE.md conventions, verify lint/typecheck/build, flag common issues (missing error handling, hardcoded strings, missing Zod validation), produce a review summary. Especially useful for reviewing my partner's PRs.

**Pre-commit hooks.** The v2 skill mandates lint + typecheck before committing, but it's voluntary — Claude Code follows it because the skill says to, nothing enforces it mechanically. A Husky pre-commit hook would make this a hard gate. Combined with CI, this creates defense in depth.

**Sub-agents for parallel execution.** The v2 skill documents which issues can run in parallel, but parallelization is manual — I open two Claude Code sessions. A sub-agent system could automatically identify independent tasks and dispatch them to parallel sessions. This is ambitious but would be the natural evolution of the parallel execution pattern we used across Sprint 3.
