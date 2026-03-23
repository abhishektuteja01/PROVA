# CLAUDE.md

Read this file completely before every task. If anything conflicts with a request, flag it — do not silently deviate. If uncertain about anything, ask before writing code.

---

## What is Prova?
SR 11-7 model documentation compliance checker. Users submit model docs → three parallel AI agents assess against SR 11-7 pillars → judge agent validates → compliance score (0–100) + PDF report.

Full spec: @docs/PRD.md | Architecture: `docs/ARCHITECTURE.md`

---

## Before You Start Any Task

| Task type | Read first |
|-----------|-----------|
| Any agent work | `docs/AGENT_PROMPTS.md` |
| Any API route | `docs/SCHEMAS.md` + `docs/ERROR_STATES.md` |
| Any database work | `docs/DATABASE.md` |
| Any UI component | `docs/PRD.md` Section 8 |
| Any scoring logic | `docs/PRD.md` Section 14.3 |
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

**Security:**
- `ANTHROPIC_API_KEY` — only in `src/lib/anthropic/client.ts`
- `SUPABASE_SECRET_KEY` — only in `src/lib/supabase/server.ts`
- All document text wrapped in `<document>...</document>` before passing to any agent
- File uploads: extension + MIME type validated server-side, memory only, never written to disk
- No `dangerouslySetInnerHTML` anywhere
- All API routes verify session server-side before any processing

**Code:**
- All Zod schemas in `src/lib/validation/schemas.ts` only — never inline
- Never skip validation on any API boundary
- All error messages from `docs/ERROR_STATES.md` exactly — never invented inline
- TypeScript strict mode — no `any` types

**AI:**
- Claude model string: `claude-haiku-3-5-20241022` — exact, no aliases
- Max tokens per agent: 1000
- Never remove bias mitigation instructions from agent prompts (verbosity, position, self-enhancement, confidence)
- Run `npm run test:ai` after any change to agents or scoring — flag if any score drifts > 10 points

**Git:**
- No direct commits to main — all changes via pull requests

---

## Stack at a Glance
Next.js 16 App Router · TypeScript strict · Supabase (PostgreSQL + Auth + RLS) · Anthropic Claude Haiku 3.5 · `@react-pdf/renderer` · `pdf-parse` · `mammoth` · Zod · Tailwind CSS · Recharts · Sentry · Vercel

---

## Design (read `docs/PRD.md` Section 8 for full spec)
- Banking-appropriate refined minimalism — data is the hero
- All scores/numbers: IBM Plex Mono · Headings: Instrument Serif · Labels: Geist
- Colors defined as CSS variables in `globals.css` — do not hardcode hex values
- Loading states: skeleton screens only, never spinners
- Mobile-web responsiveness: fluid scaling via Tailwind (mobile-first)
- Never use: Inter, Roboto, Arial, purple gradients, generic AI aesthetics

---

## Testing Strategy

- **Unit tests** (`npm test`): Zod schema validation, scoring logic, utility functions — pure functions only, no mocks of internal code
- **AI regression tests** (`npm run test:ai`): Run after every agent/prompt/scoring change; flag any score drift > 10 points
- **TDD approach**: Write failing tests first, implement minimum code to pass, then refactor — red → green → refactor commit pattern
- **No mocking internal modules**: Test against real logic; only mock at system boundaries (Supabase client, Anthropic API)
- **Test files**: Co-located with source at `*.test.ts` — never in a separate top-level `tests/` folder

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI orchestration | Three parallel agents + judge | Reduces single-agent hallucination risk; judge catches conflicting scores |
| Auth | Supabase Auth + RLS | Eliminates manual row-level security; session token never touches client |
| Document processing | Memory only, never disk | Regulatory requirement — no PII/model docs persisted outside DB |
| PDF generation | `@react-pdf/renderer` server-side | Avoids headless browser; deterministic output |
| Validation | Zod at every API boundary | Runtime safety on top of TypeScript; single source of truth in `schemas.ts` |

---

## Sprint Context
| Sprint | Dates | Focus |
|--------|-------|-------|
| 1 | Mar 19–29 | Auth, document input, single agent end-to-end |
| 2 | Mar 30–Apr 9 | All three agents, judge, scoring, dashboard, PDF |
| 3 | Apr 10–19 | CI/CD, monitoring, security, test suite, polish |

Check with me for current sprint before starting work.