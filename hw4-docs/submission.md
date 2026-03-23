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

Executed the plan on exactly the 2 files identified:

- **`src/app/(auth)/login/page.tsx`** — Full UI: centered card with dot-grid background, email + password fields with focus states, inline error display, loading state (disabled button + label change, no spinner), Supabase `signInWithPassword`, redirect to `/dashboard` on success.
- **`src/app/(auth)/signup/page.tsx`** — Mirrors login layout. Three fields with client-side password match validation. Calls `supabase.auth.signUp`. On success: switches to a confirmation state showing the user's email — no redirect (Supabase sends a verification email).

Both pages use only CSS variables and inline styles (no stub UI components), matching the established pattern from `src/app/page.tsx`.

#### Commits

| # | Hash | Message |
|---|------|---------|
| 1 | `8619cfa` | `explore: audit auth stubs, design system, and Supabase client patterns` |
| 2 | `73a9d00` | `feat: implement login page with Supabase email/password auth` |
| 3 | `ac9c31e` | `feat: implement signup page with email confirmation flow` |

The git history clearly shows the Explore → Plan → Implement progression. Commit 1 is pure exploration (no source changes), commits 2–3 are implementation only after the plan was approved.

---

## Part 3: TDD with Claude Code (30%)

### Feature: Validation Schemas (`src/lib/validation/schemas.ts`)

The file was empty (`export {}`). TDD was used to drive the full implementation.

#### Acceptance Criteria (written as tests first)

| Schema | Test | Criteria |
|--------|------|---------|
| `loginSchema` | valid email + password ≥ 8 chars | passes |
| `loginSchema` | empty email | fails |
| `loginSchema` | malformed email | fails |
| `loginSchema` | password < 8 chars | fails |
| `loginSchema` | missing password | fails |
| `signupSchema` | valid email + matching passwords | passes |
| `signupSchema` | passwords don't match | fails |
| `signupSchema` | password < 8 chars | fails |
| `signupSchema` | malformed email | fails |
| `documentUploadSchema` | PDF within 10 MB | passes |
| `documentUploadSchema` | DOCX within 10 MB | passes |
| `documentUploadSchema` | unsupported file type | fails |
| `documentUploadSchema` | file > 10 MB | fails |
| `documentUploadSchema` | zero-byte file | fails |

#### Red → Green → Refactor Commits

| Phase | Hash | Message |
|-------|------|---------|
| Setup | `36d4cd0` | `chore: add Jest config and test script` |
| **Red** | `674d539` | `test(red): write failing tests for loginSchema, signupSchema, documentUploadSchema` |
| **Green** | `b8a6a17` | `feat(green): implement loginSchema, signupSchema, documentUploadSchema` |
| **Refactor** | `cf9b667` | `refactor: export ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES` |

**Red:** All 14 tests written and committed before a single line of implementation. Running `npm test` showed 14 failed.

**Green:** Minimum Zod schemas written to pass all 14 tests — `loginSchema`, `signupSchema` with `.refine()` for password match, `documentUploadSchema` with MIME type enum and size bounds. `npm test` showed 14 passed.

**Refactor:** Made the constants (`ALLOWED_MIME_TYPES`, `ALLOWED_EXTENSIONS`, `MAX_FILE_SIZE_BYTES`) exported so UI components can reference the same source of truth. No new tests needed — all 14 still pass.

---

## Part 4: Reflection (15%)

### How the Explore → Plan → Implement → Commit Workflow Compares to My Previous Approach

Honestly, my usual approach was to just open the file I thought I needed to edit and start writing. If something broke or turned out to be wrong, I'd fix it then. It wasn't terrible for small tasks but it caused a lot of wasted effort — especially when I'd get halfway through something and realize the assumption I started with was wrong.

What surprised me about the Explore phase is how often it changes what you were about to do. When I started the login page task, I assumed the generic `Button` and `Input` components were ready to use. They weren't — every file in `src/components/ui/` returns null. Without Explore, I would have imported them, seen nothing render, spent time debugging it, and only then figured out the problem. Finding it upfront took 30 seconds.

The other thing Explore caught was the `proxy.ts` bug — the middleware was in a file Next.js would never pick up. That wasn't part of the task at all, but it came up during exploration and we fixed it before it could cause confusion later.

Plan mode felt like overkill at first. Writing out the approach before coding it seemed like extra ceremony. But it forced me to make decisions explicitly — like whether to build the UI components or just use inline styles like the rest of the codebase. Before, I'd make that call unconsciously mid-implementation. Having to write it down meant I could defend the reasoning and it didn't change halfway through.

The commit structure is the part I'll actually keep. Separating explore, implement, and fix into distinct commits makes the history tell a story. When I look back at `8619cfa`, I know exactly what state the codebase was in and what we knew at that point. That's genuinely useful.

### What Context Management Strategies Worked Best

`/compact` before starting the Explore phase worked better than waiting until the context got full. By the time you're mid-exploration, compacting interrupts the flow and you lose the thread of what you were looking at.

`--continue` between Plan and Implement was the most important one. The plan file captures the decisions, but the context carries the *reasoning* — why you decided against implementing the UI components, what the Supabase client pattern looks like. Without continuing, you'd be re-explaining all of that to a fresh context.

`/clear` at the start of Part 3 made sense because TDD on schemas had no connection to anything we'd done before. Starting fresh meant the agent wasn't trying to apply patterns from auth pages to a totally different task.

The thing I learned is that context isn't just about token limits. It's about relevance. Carrying 20 files of Framer Motion animation code into a session about Zod schemas just adds noise.

---

### Annotated Claude Code Session Log

```
[Part 1 — Project Setup]

> lets work on a mid project assignment
  → reads questions.md, CLAUDE.md
  → identifies 4 gaps: no @import, thin permissions, missing testing
     strategy section, missing architecture decisions table

> 1. Yes just one import for prd, expand yes and add yes.
  ✏️  CLAUDE.md — @docs/PRD.md import added, Testing Strategy + Architecture
       Decisions sections added
  ✏️  .claude/settings.local.json — 3 rules → 19 allow + 3 deny
  // Claude only changed what was asked, nothing extra

[Part 2 — Explore]

  🔍 Glob src/**/*.tsx → 31 files mapped
  🔍 Glob src/**/*.ts  → 22 files mapped
  🔍 Read login/page.tsx    → stub: <div>Login</div>
  🔍 Read signup/page.tsx   → stub: return null
  🔍 Read schemas.ts        → empty: export {}
  🔍 Read page.tsx          → design system patterns confirmed
  🔍 Read middleware.ts     → auth routing logic confirmed
  // proxy.ts issue not caught here — surfaced later as a bug report

[Part 2 — Plan]

  EnterPlanMode
  → sub-agent reads: layout.tsx, all ui/ stubs, supabase/client.ts
  → finding: ui/ components all return null, don't use them
  → plan: inline styles only, 2 files, Supabase signInWithPassword,
     no spinner, email confirmation state on signup
  ExitPlanMode → approved

[Part 2 — Implement]

  ✏️  login/page.tsx — centered card, email+password, error state,
       Supabase auth, redirect to /dashboard
  ✅  npm run typecheck → clean
  📝  commit: feat: implement login page with Supabase email/password auth

  ✏️  signup/page.tsx — same layout, adds confirmPassword field,
       client-side match check, email confirmation state on success
  ✅  npm run typecheck → clean
  📝  commit: feat: implement signup page with email confirmation flow

[Bug — middleware not running]

> why is the main page taking me to login?
  🔍 Read middleware.ts     → logic correct
  🔍 Glob src/middleware.ts → not found
  🔍 Read src/proxy.ts      → middleware in wrong filename!
  // Next.js only reads src/middleware.ts, never src/proxy.ts
  mv src/proxy.ts src/middleware.ts
  📝  commit: fix: rename proxy.ts to middleware.ts

> we need to create a new branch
  git checkout -b feat/auth-login-signup
  git push -u origin feat/auth-login-signup

[Part 3 — TDD Setup]

  🔍 Glob *.test.ts  → existing stubs in tests/, all empty
  🔍 Read package.json → no test script
  ✏️  jest.config.ts — ts-jest + @/ alias
  ✏️  package.json   — adds "test": "jest"
  📝  commit: chore: add Jest config and test script

[Part 3 — Red]

  ✏️  schemas.test.ts — 14 tests written before any implementation
       loginSchema (5), signupSchema (4), documentUploadSchema (5)
  ✅  npm test → 14 FAILED  ← RED
  📝  commit: test(red): write failing tests...

[Part 3 — Green]

  ✏️  schemas.ts — loginSchema, signupSchema + .refine() for password
       match, documentUploadSchema with MIME enum + 10MB limit
  ✅  npm test → 14 PASSED  ← GREEN
  📝  commit: feat(green): implement schemas...

[Part 3 — Refactor]

  ✏️  schemas.ts — make ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS,
       MAX_FILE_SIZE_BYTES exported constants (UI can reference them)
  ✅  npm test → 14 PASSED  ← still green
  📝  commit: refactor: export constants...
  git push
```
