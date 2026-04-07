# Skill: implement-feature (v1)

## Description
Implement a feature from the Prova GitHub Issues spec. Reads the issue, reads relevant source files, implements the code, and commits to a feature branch.

## When to Use
When starting work on any S1-xx, S2-xx, or S3-xx issue from `docs/prova-github-issues.md`.

## Instructions

### Step 1: Read the Issue
Read `docs/prova-github-issues.md` and find the issue by ID (e.g., "S2-06"). Read the full issue spec including Overview, Components/Routes to Build, Design Requirements, and Acceptance Criteria.

### Step 2: Read Context Files
Based on the issue type, read the relevant CLAUDE.md files and source files:
- API work → `src/app/api/CLAUDE.md`, `src/lib/errors/messages.ts`, `src/lib/validation/schemas.ts`
- Frontend work → `src/components/CLAUDE.md`, existing component files referenced in the issue
- Agent work → `src/lib/agents/CLAUDE.md`, `docs/AGENT_PROMPTS.md`
- Any work → `CLAUDE.md` (root), `docs/DATABASE.md` if DB tables are involved

### Step 3: Implement
Implement all code changes described in the issue. Follow all rules from the relevant CLAUDE.md files:
- TypeScript strict mode — no `any` types
- All Zod schemas in `src/lib/validation/schemas.ts` only
- All error messages from `src/lib/errors/messages.ts`
- Use `createServerClient()` for RLS-respecting reads
- Use `createServiceClient()` only for RLS-bypass writes
- CSS variables for all colors, never hardcode hex
- Skeleton loading only, never spinners
- No `dangerouslySetInnerHTML`

### Step 4: Verify
Run `npm run build` and `npm run typecheck` — both must pass with zero errors.

### Step 5: Commit and Push
- Create branch: `feat/{issue-id}-{short-description}`
- Stage all changed files
- Commit with message: `feat({issue-id}): {description}`
- Update `docs/prova-github-issues.md`: change issue status from 🔲 Pending to ✅ Done
- Commit docs separately: `docs: mark {issue-id} as done in issue tracker`
- Push branch, do NOT push to main

## Constraints
- Never commit directly to main
- Never modify agent prompt content — copy verbatim from AGENT_PROMPTS.md
- Never skip Zod validation on any API boundary
- Must pass `npm run build` before committing
