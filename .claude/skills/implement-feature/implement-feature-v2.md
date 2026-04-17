# Skill: implement-feature (v2)

## Description
Implement a feature from the Prova GitHub Issues spec using a plan-then-execute workflow with backend/frontend splitting for reviewability. This is the production workflow refined across 10+ feature implementations.

## When to Use
When starting work on any issue from `docs/prova-github-issues.md`.

## What Changed from v1
- **Added plan-before-execute step** — plan mode first, human reviews the plan, then execute. Catches architectural mistakes before code is written.
- **Added backend/frontend split** — issues with both API routes and UI pages are implemented in two separate runs. Smaller diffs are easier to review (especially important for ADHD-friendly review sessions). Backend can be verified independently before frontend builds on top of it.
- **Added lint/typecheck pre-commit check** — v1 only ran `npm run build`. CI caught lint errors that build didn't. Now we run `npm run lint`, `npm run typecheck`, AND `npm run build` before committing.
- **Added conflict-aware doc updates** — `docs/prova-github-issues.md` is a frequent merge conflict source. Now we batch doc status updates and handle conflicts by manually merging both sides' status changes (never accept-current or accept-incoming blindly).
- **Added conventional commit messages** — `feat(S2-06):`, `fix:`, `test(S3-05):`, `security(S3-04):` prefixes for clear git history.
- **Added parallel execution awareness** — independent issues (e.g., S3-01 CI/CD + S3-06 Help Page) can run simultaneously in separate Claude Code sessions.
- **Added CI-first mindset** — after S3-01 introduced CI, every PR must pass the pipeline. Run lint locally before pushing to avoid failed CI runs.

## Instructions

### Step 1: Read the Issue
Read `docs/prova-github-issues.md` and find the issue by ID. Read the full spec.

### Step 2: Read Context Files
Based on the issue type, read relevant files:

| Task Type | Read First |
|-----------|-----------|
| API routes | `src/app/api/CLAUDE.md` + `src/lib/errors/messages.ts` + `src/lib/validation/schemas.ts` + `docs/DATABASE.md` |
| Frontend pages | `src/components/CLAUDE.md` + existing components referenced in the issue |
| Agent work | `src/lib/agents/CLAUDE.md` + `docs/AGENT_PROMPTS.md` |
| Scoring logic | `src/lib/scoring/CLAUDE.md` + `tests/scoring/calculator.test.ts` |
| Security | `src/lib/security/CLAUDE.md` |
| Tests | Existing test files for the pattern (e.g., `tests/agents/conceptualSoundness.test.ts`) |

Always also read: `CLAUDE.md` (root-level rules).

### Step 3: Decide — Split or Single Run?

**Split into backend + frontend runs when:**
- The issue has both API routes AND UI pages (e.g., S2-06, S2-07)
- The backend changes affect schemas or validation that frontend depends on
- The total diff would exceed ~400 lines

**Single run when:**
- The issue is purely backend (e.g., S3-04 security audit)
- The issue is purely frontend (e.g., S3-06 help page)
- The issue is config/infra (e.g., S3-01 CI/CD)

### Step 4: Plan First (for complex issues)

For issues that are medium or large complexity, use plan mode:
```
plan [your implementation prompt here]
```

Review the plan output. Check for:
- Does it read the right context files?
- Does it follow the codebase conventions (errorResponse(), createServerClient(), schemas in schemas.ts)?
- Does it handle edge cases mentioned in the issue spec?
- Are there data shape mismatches between what exists and what's being built?

Only after the plan looks good, approve execution.

**Skip planning for:**
- Simple config changes (CI YAML files, package.json updates)
- Documentation-only tasks (security audit docs, issue tracker updates)
- Bug fixes with an obvious solution (lint errors, missing dependencies)

### Step 5: Implement

Follow all rules from the relevant CLAUDE.md files:
- TypeScript strict mode — no `any` types
- All Zod schemas in `src/lib/validation/schemas.ts` only — never inline
- All error codes/messages from `src/lib/errors/messages.ts` — never hardcode
- `createServerClient()` for all RLS-respecting reads
- `createServiceClient()` only for RLS-bypass writes (rare — only when writing on behalf of a user)
- Next.js 16: `await params` in route handlers (async params)
- Supabase NUMERIC columns return strings — wrap in `Number()` before use
- `.maybeSingle()` not `.single()` for queries that might return no rows
- CSS variables for all colors (e.g., `var(--color-compliant)`) — never hardcode hex
- Fonts: Playfair Display for headings, IBM Plex Mono for scores/data, Geist for labels
- Skeleton loading only — never spinners
- No `dangerouslySetInnerHTML` anywhere
- Framer Motion for animations (staggered fade-in with `[0.16, 1, 0.3, 1]` easing)

### Step 6: Verify Before Committing

Run ALL three checks — not just build:
```bash
npm run lint        # catches ESLint errors CI will flag
npm run typecheck   # catches TypeScript errors
npm run build       # catches build-time errors
npm test            # catches test regressions (if tests exist)
```

If lint has warnings, fix them. CI treats warnings as noise that accumulates. Fix unused imports, unused variables (prefix with `_` or remove), and unused eslint-disable directives.

### Step 7: Commit with Conventional Messages

Create branch: `feat/{issue-id}-{short-description}` (e.g., `feat/s2-06-submissions`)

Commit message format by type:
- Features: `feat(S2-06): submission API routes — paginated list, detail, delete`
- Bug fixes: `fix: resolve lint errors caught by CI pipeline`
- Tests: `test(S3-05): unit tests for agents, judge, and orchestrator`
- Security: `security(S3-04): security audit and hardening checklist`
- CI/Infra: `ci(S3-01): add PR and deploy GitHub Actions workflows`
- Docs only: `docs: mark S3-01 as done in issue tracker`

If the issue has backend + frontend, commit them separately:
```
Commit 1: feat(S2-06): submission API routes — paginated list, detail, delete
Commit 2: feat(S2-06): submission history and detail pages
```

### Step 8: Update Issue Tracker (Carefully)

Update `docs/prova-github-issues.md` — change issue status from 🔲 Pending to ✅ Done.

**Commit doc updates separately** from code changes:
```
docs: mark S2-06 as done in issue tracker
```

**Conflict handling:** This file is the #1 merge conflict source. When rebasing, NEVER blindly accept-current or accept-incoming. Manually merge by keeping the correct status for each issue from both sides. If current branch has S3-04 ✅ Done and incoming has S3-06 ✅ Done, the merge should have BOTH as ✅ Done.

### Step 9: Push and PR

```bash
git push origin feat/{branch-name}
```

PR title format: `feat(S2-06): submission history and single submission view`

PR body should include:
- Summary of what was built
- List of files created/modified
- Which GitHub issue it closes: `Closes #26`
- Any decisions made (e.g., "Used Option A for data shape mismatch")

Do NOT push to main. All changes go through PRs.

### Step 10: Post-PR Checklist

After pushing:
- [ ] CI pipeline passes (lint + typecheck + test + build)
- [ ] If CI fails, fix on the same branch and push again
- [ ] If CI fails due to issues on main (not your branch), fix main first, then rebase

## Parallel Execution

Independent issues can run simultaneously in separate Claude Code sessions:
- S3-01 (CI/CD) + S3-06 (Help Page) — zero overlap
- S3-04 (Security) + S3-05 (Unit Tests) — zero overlap

Do NOT parallelize issues that touch the same files:
- Any two issues that both modify `schemas.ts`
- Any two issues that both modify `docs/prova-github-issues.md` (conflict guaranteed)

## Constraints
- Never commit directly to main — all changes via pull requests
- Never modify agent prompt content — copy verbatim from AGENT_PROMPTS.md
- Never skip Zod validation on any API boundary
- `ANTHROPIC_API_KEY` only in `src/lib/anthropic/client.ts`
- `SUPABASE_SECRET_KEY` only in `src/lib/supabase/server.ts`
- Run lint + typecheck + build before every commit
- Use actual GitHub issue numbers in PR closing keywords (e.g., `Closes #26`)
