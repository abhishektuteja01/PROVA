---
name: implement-feature
description: Implement any GitHub issue in this repo. Reads the issue, plans, splits backend/frontend if needed, implements, verifies, and opens a PR.
trigger: When the user says "implement issue #N", "work on issue #N", or "start on #N"
---

## Steps

### 1. Read the Issue
Fetch the issue from GitHub:
```bash
gh issue view {N} --json title,body,labels,assignees
```
Read the full spec — title, body, acceptance criteria, labels.

### 2. Load Context
Based on what the issue involves, read the relevant sub-CLAUDE.md:

| Issue involves | Read first |
|----------------|-----------|
| API routes | `src/app/api/CLAUDE.md` + `src/lib/errors/messages.ts` + `src/lib/validation/schemas.ts` |
| UI / components | `src/components/CLAUDE.md` + existing components referenced in the issue |
| Agent / AI logic | `src/lib/agents/CLAUDE.md` + `docs/AGENT_PROMPTS.md` |
| Scoring | `src/lib/scoring/CLAUDE.md` |
| Security | `src/lib/security/CLAUDE.md` |
| DB schema | `docs/DATABASE.md` |

Always read root `CLAUDE.md` first.

### 3. Split or Single Run?
**Split into backend + frontend when:**
- Issue has both API routes AND UI pages
- Backend changes affect schemas/types the frontend depends on
- Total diff would exceed ~400 lines

**Single run when:**
- Purely backend, purely frontend, or config/infra only

### 4. Plan First (medium/large issues)
Use plan mode before writing any code. Review the plan for:
- Correct context files read
- Follows codebase conventions (`errorResponse()`, `createServerClient()`, schemas in `schemas.ts`)
- Handles edge cases from the issue spec
- No data shape mismatches

Skip planning for: simple config changes, docs-only tasks, obvious bug fixes.

### 5. Implement
Follow all rules from the relevant CLAUDE.md files. Key reminders:
- TypeScript strict — no `any`
- Zod schemas in `src/lib/validation/schemas.ts` only
- Error codes from `src/lib/errors/messages.ts` only
- `createServerClient()` for RLS reads, `createServiceClient()` for RLS-bypass writes only
- Next.js 16: `await params` in route handlers
- Supabase NUMERIC columns return strings — wrap in `Number()` before use
- `.maybeSingle()` not `.single()` for queries that may return no rows
- CSS variables for colors — never hardcode hex
- Skeleton loading only — never spinners
- No `dangerouslySetInnerHTML`

### 6. Verify Before Committing
Run all four — not just build:
```bash
npm run lint
npm run typecheck
npm run build
npm test
```
Fix lint warnings before committing — CI treats accumulating warnings as noise.

### 7. Commit
Branch: `feat/{issue-id}-{short-description}`

Conventional commit prefixes:
- `feat(#{N}):` — new feature
- `fix(#{N}):` — bug fix
- `test(#{N}):` — tests only
- `ci:` — CI/infra config
- `docs:` — documentation only

If split run, commit backend and frontend separately.

### 8. Open PR
```bash
git push origin {branch}
gh pr create --title "feat(#{N}): {description}" --body "..."
```

PR body must include:
- Summary of what was built
- Files created/modified
- `Closes #{N}`
- Any non-obvious decisions made

## Constraints
- Never commit to main — PRs only
- Never modify agent prompt content — copy verbatim from `docs/AGENT_PROMPTS.md`
- Never skip Zod validation on any API boundary
- Run lint + typecheck + build before every commit
