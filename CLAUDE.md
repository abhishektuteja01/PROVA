# CLAUDE.md

Read this file completely before every task. If anything conflicts with a request, flag it — do not silently deviate. If uncertain about anything, ask before writing code.

---

## What is Prova?
SR 11-7 model documentation compliance checker. Users submit model docs → three parallel AI agents assess against SR 11-7 pillars → judge agent validates → compliance score (0–100) + PDF report.

Full spec: `docs/PRD.md` | Architecture: `docs/ARCHITECTURE.md`

---

## Folder-Level CLAUDE.md Rule

**When creating a new folder under `src/`, create a CLAUDE.md in that folder first** — before writing any code. The CLAUDE.md should contain the domain-specific rules, relevant PRD line references, and doc links for that folder's responsibility. Follow the pattern of existing folder CLAUDE.md files.

---

## Before You Start Any Task

Each folder has its own CLAUDE.md with domain-specific rules. The relevant one loads automatically when you work in that folder. If you need broader context, read the referenced docs on-demand:

| Task type | Read first |
|-----------|-----------|
| Any agent work | `src/lib/agents/CLAUDE.md` + `docs/AGENT_PROMPTS.md` |
| Any API route | `src/app/api/CLAUDE.md` + `docs/SCHEMAS.md` + `docs/ERROR_STATES.md` |
| Any database work | `docs/DATABASE.md` |
| Any UI component | `src/components/CLAUDE.md` |
| Any scoring logic | `src/lib/scoring/CLAUDE.md` |
| Any validation work | `src/lib/validation/CLAUDE.md` + `docs/SCHEMAS.md` |
| Any security work | `src/lib/security/CLAUDE.md` |
| File structure / tech specs | `docs/TECHNICAL_SPECS.md` |
| Modifying agent prompts | Run `npm run test:ai` after |

---

## Commands
```bash
npm run dev
npm run build        # type check + build
npm run lint
npm run typecheck
npm test
npm run test:ai      # AI regression suite — run after any agent/scoring change
```

---

## Environment Variables
```
ANTHROPIC_API_KEY              # Server-side only — src/lib/anthropic/client.ts ONLY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
SUPABASE_SECRET_KEY            # Server-side only — src/lib/supabase/server.ts ONLY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SENTRY_DSN         # Browser — sentry.client.config.ts ONLY
SENTRY_DSN                     # Server/edge — instrumentation.ts ONLY
SENTRY_ORG                     # Build-time — next.config.ts ONLY (source map uploads)
SENTRY_PROJECT                 # Build-time — next.config.ts ONLY (source map uploads)
RATE_LIMIT_REQUESTS_PER_HOUR   # Default: 10
```

---

## Non-Negotiable Rules

- TypeScript strict mode — no `any` types
- No direct commits to main — all changes via pull requests
- All Zod schemas in `src/lib/validation/schemas.ts` only — never inline
- Never skip validation on any API boundary
- All error codes/messages from `src/lib/errors/messages.ts` — never hardcode inline
- `ANTHROPIC_API_KEY` — only in `src/lib/anthropic/client.ts`
- `SUPABASE_SECRET_KEY` — only in `src/lib/supabase/server.ts`
- No `dangerouslySetInnerHTML` anywhere

---

## Stack at a Glance
Next.js 16 App Router · TypeScript strict · Supabase (PostgreSQL + Auth + RLS) · Anthropic Claude Haiku 3.5 · `@react-pdf/renderer` · `pdf-parse` · `mammoth` · Zod · Tailwind CSS · Recharts · Sentry · Vercel

---

## Testing Strategy

- **Unit tests** (`npm test`): Zod schema validation, scoring logic, utility functions — pure functions only, no mocks of internal code
- **AI regression tests** (`npm run test:ai`): Run after every agent/prompt/scoring change; flag any score drift > 10 points
- **TDD approach**: Write failing tests first, implement minimum code to pass, then refactor — red → green → refactor commit pattern
- **No mocking internal modules**: Test against real logic; only mock at system boundaries (Supabase client, Anthropic API)
- **Test files**: Co-located with source at `*.test.ts` — never in a separate top-level `tests/` folder

---

## Current Sprint
**Sprint 2** (Mar 30–Apr 9) — All three agents, judge, scoring, dashboard, PDF.
Full schedule: `docs/PRD.md` section 10. Check with me before starting work.
