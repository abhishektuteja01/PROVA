# HW4: Claude Code Workflow & TDD — Submission

---

## Part 1: Claude Code Project Setup (25%)

### CLAUDE.md

`CLAUDE.md` is checked into the root of the repository. It includes:

- **What is Prova** — project description and purpose
- **Tech Stack** — Next.js 16 App Router, TypeScript strict, Supabase, Anthropic Claude Haiku 3.5, Zod, Tailwind CSS, Recharts, Sentry, Vercel
- **Architecture Decisions** — table covering agent design rationale, auth approach, document processing, PDF generation, and validation strategy
- **Coding Conventions** — Zod schemas only in `src/lib/validation/schemas.ts`, no `any` types, error messages from `docs/ERROR_STATES.md` only
- **Testing Strategy** — TDD approach, no mocking internal modules, test co-location, AI regression suite
- **Project-specific Do's/Don'ts** — Non-Negotiable Rules section covering security, code, AI model config, and git workflow
- **`@import` reference** — `@docs/PRD.md` imported directly for full product spec context

### Permissions Configuration

`.claude/settings.local.json` defines an explicit allowlist and denylist:

**Allowed:**
- `node:*` — running Node scripts
- `npm run dev/build/lint/typecheck/test/test:ai/install` — all project scripts
- `git status/diff/log/add/commit/checkout/branch/push` — standard git operations
- `gh issue*`, `gh pr*` — GitHub CLI for issues and PRs

**Denied:**
- `rm -rf*` — no destructive file deletion
- `curl*`, `wget*` — no arbitrary network requests from agent

### /init and CLAUDE.md Iteration

Running `/init` in Claude Code scans the repository structure and generates a baseline `CLAUDE.md`. The initial output covered the file tree and stack but lacked:
- Architecture decision rationale (why each choice was made)
- Testing strategy and TDD approach
- Explicit security rules around API key placement
- Design system constraints (fonts, colors, no spinners)

After iterating based on `/init` output, we added the **Architecture Decisions** table and **Testing Strategy** section to make the file actionable rather than purely descriptive.

### Context Management Strategy

- **`/clear`** — used at the start of each new feature to avoid context bleed from prior tasks
- **`/compact`** — used mid-session when token usage grows large (e.g., after reading many files during Explore phase)
- **`--continue`** — used to resume a session when implementation spans multiple sittings without losing prior context

---

## Part 2: Explore → Plan → Implement → Commit (30%)

### Feature: Login & Signup Pages (Sprint 1 — Auth)

#### Explore

Used `Glob`, `Grep`, and `Read` to audit the codebase before writing any code:

```
Glob: src/**/*.tsx  → mapped all existing UI components and pages
Glob: src/**/*.ts   → mapped all lib files, API routes, validation
Read: src/app/(auth)/login/page.tsx     → stub: <div>Login</div>
Read: src/app/(auth)/signup/page.tsx    → stub: return null
Read: src/lib/validation/schemas.ts     → empty: export {}
Read: src/app/page.tsx                  → fully built home page, design system patterns visible
Read: src/components/layout/Navbar.tsx  → minimal, design system confirmed
Read: src/lib/supabase/middleware.ts    → auth routing already in place
```

**Key findings:**
- Login and signup pages are stubs — Sprint 1's primary auth deliverable is missing
- Design system is established in `page.tsx`: CSS variables, IBM Plex Mono for numbers/mono, Instrument Serif for headings, Geist for labels
- Middleware already handles redirect-to-login for unauthenticated users
- Validation schemas file is empty — no Zod schemas exist yet

#### Plan

Used Plan mode (`EnterPlanMode`) to design the approach before writing any code:

- All `src/components/ui/` files are stubs — use inline styles + CSS variables, same pattern as `src/app/page.tsx`
- Supabase browser auth: `createClient()` from `src/lib/supabase/client.ts`, call `supabase.auth.signInWithPassword` / `supabase.auth.signUp`
- No spinners — loading state via disabled button + label change only (per CLAUDE.md)
- Login: redirect to `/dashboard` on success
- Signup: show "Check your email" confirmation state (Supabase sends confirmation email)
- Only 2 files change: `login/page.tsx` and `signup/page.tsx`

#### Implement

*(in progress)*

#### Commits

*(will be added as commits are made)*

---

## Part 3: TDD with Claude Code (30%)

*(in progress)*

---

## Part 4: Reflection (15%)

*(to be written after Parts 2 and 3 are complete)*

---
