# implement-feature Skill: v1 → v2 Iteration Log

## Overview
The `implement-feature` skill automates implementing GitHub issues from the Prova issue spec. v1 was the initial workflow; v2 incorporates lessons learned across 11 feature implementations (S2-06 through S3-06).

## What Changed and Why

### 1. Added Plan-Before-Execute Step
**Problem (v1):** On S2-06, Claude Code generated 4 API routes + 2 pages + a modal in one massive run. The output had a data shape mismatch — `ComplianceResults` expected a `ComplianceResponse` prop but the submission detail API returned a different shape. This wasn't caught until review.

**Fix (v2):** Complex issues now use `plan` mode first. Human reviews the plan before any code is written. This caught the data shape issue on S2-06 Run 2 and led to the correct architectural decision (Option A: reuse sub-components directly instead of faking a ComplianceResponse).

**Evidence:** S2-06 frontend plan review identified the ComplianceResults vs SubmissionDetail mismatch before a single line of code was written.

### 2. Added Backend/Frontend Split
**Problem (v1):** When an issue has both API routes and UI pages, implementing everything in one run produces a 500+ line diff that's hard to review thoroughly. With ADHD, reviewing large diffs leads to rubber-stamping the later parts.

**Fix (v2):** Issues with both backend and frontend are split into two runs. Backend first (API routes, schemas, validation), then frontend (pages, components) in a second run. Each diff is focused and reviewable in one sitting.

**Evidence:** S2-06 was split into Run 1 (4 API routes, ~200 lines) and Run 2 (2 pages + modal, ~250 lines). Each was reviewed thoroughly. S2-07 (PDF report) was also split: ReportDocument.tsx + API route.

### 3. Added Lint/Typecheck Pre-Commit Check
**Problem (v1):** v1 only ran `npm run build` before committing. After S3-01 added CI, the pipeline caught lint errors that build didn't — specifically `react-hooks/set-state-in-effect` in settings page (calling setState directly in useEffect) and unused variables across 4 files. Both S3-01 and S3-06 PRs failed CI.

**Fix (v2):** Now runs `npm run lint`, `npm run typecheck`, AND `npm run build` before every commit. Also fixes warnings (unused imports, unused eslint-disable directives) proactively instead of letting them accumulate.

**Evidence:** PR #52 (S3-01) and PR #53 (S3-06) both failed CI lint. Required a separate `fix/lint-errors` PR (#54) to clean main, then rebase both branches. Added ~30 minutes of rework that v2 prevents.

### 4. Added Conflict-Aware Doc Updates
**Problem (v1):** `docs/prova-github-issues.md` was updated in every feature branch. When two branches were open simultaneously, the doc had conflicting status updates. On S2-07 merge, the doc showed S2-06 as "Pending" on the branch but "Done" on main. GitHub's "Accept Current Change" / "Accept Incoming Change" buttons were both wrong — neither had the complete truth.

**Fix (v2):** Doc status updates are committed separately from code changes. When resolving conflicts, manually merge by keeping the correct status from BOTH sides. Never blindly accept one side. Also batch doc updates when possible to reduce conflict frequency.

**Evidence:** Merge conflicts occurred on S2-07, S3-04, and S3-06 branches — all in the same file. Each required manual resolution combining statuses from both sides.

### 5. Added Conventional Commit Messages
**Problem (v1):** Early commits had generic messages that didn't indicate the issue ID or type of change. Made git log harder to navigate.

**Fix (v2):** Standardized on conventional commit format: `feat(S2-06):`, `fix:`, `test(S3-05):`, `security(S3-04):`, `ci(S3-01):`, `docs:`. Each commit is traceable to a specific issue.

### 6. Added Parallel Execution Awareness
**Problem (v1):** No guidance on which issues could run simultaneously. Early in the session, tasks were run sequentially even when independent.

**Fix (v2):** Explicitly identifies independent issues that can run in parallel (e.g., S3-04 Security + S3-05 Unit Tests) and warns against parallelizing issues that touch the same files (especially `schemas.ts` and the issue tracker doc).

**Evidence:** S3-04 and S3-05 ran simultaneously in separate Claude Code sessions. S3-01 and S3-06 also ran in parallel. Saved ~40 minutes of total wall-clock time.

### 7. Added CI-First Mindset
**Problem (v1):** No CI pipeline existed during Sprint 2. Errors were only caught locally by `npm run build`. After S3-01 added CI, the pipeline became the quality gate — and it caught errors the local workflow missed.

**Fix (v2):** After S3-01, every PR must pass CI. The skill now includes: check CI status after push, fix failures on the same branch, and if CI fails due to issues on main (not the branch), fix main first then rebase all open branches.

**Evidence:** The `ts-node` missing dependency and lint errors both required fixing main first, then rebasing 4 feature branches. This pattern is now documented in the skill.

## Tasks Executed with Each Version

### v1 (S2-06 Run 1)
- S2-06 Backend: 4 API routes implemented in one run ✅

### v2 (S2-06 Run 2 through S3-06)
- S2-06 Frontend: Plan → review → execute split ✅
- S2-07 PDF Report: Backend/frontend split, plan mode ✅
- S2-08 Settings Page: Plan mode, auth callback dependency caught in review ✅
- S3-01 CI/CD: Skip planning (simple config), direct execution ✅
- S3-04 Security Audit: Skip planning (grep-based audit), direct execution ✅
- S3-05 Unit Tests: Skip planning (clear pattern from existing tests), direct execution ✅
- S3-06 Help Page: Skip planning (static content), direct execution ✅
- S3-02 AI Regression: Plan mode (complex — 7 synthetic docs + runner + drift detection) ✅

## Metrics
- **Issues completed with v1 workflow:** 1 (S2-06 backend only)
- **Issues completed with v2 workflow:** 10 (S2-06 frontend through S3-02)
- **CI failures caused by v1 patterns:** 2 (lint errors, missing ts-node)
- **CI failures caused by v2 patterns:** 0 (lint runs locally before commit)
- **Merge conflicts from doc updates:** 3 (all resolved correctly using v2's manual merge guidance)
- **Time saved by parallel execution:** ~40 minutes (S3-04+S3-05 parallel, S3-01+S3-06 parallel)
