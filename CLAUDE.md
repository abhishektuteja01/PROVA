# CLAUDE.md

Flag conflicts before acting. Ask before writing code if uncertain.

---

## What is Prova?
SR 11-7 compliance checker. Users submit model docs → three parallel agents assess SR 11-7 pillars → judge validates → score (0–100) + PDF report.

Spec: `docs/PRD.md` | Architecture: `docs/ARCHITECTURE.md`

---

## Folder Rules
New folder under `src/`? Create its CLAUDE.md first. Sub-files are auto-imported below — domain rules live there, not here.

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

---

## Commands
```bash
npm run dev
npm run build       # type check + build
npm run lint
npm run typecheck
npm test
npm run test:ai     # run after any agent/scoring/prompt change
```

---

## Environment Variables
```
ANTHROPIC_API_KEY                          # src/lib/anthropic/client.ts ONLY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
SUPABASE_SECRET_KEY                        # src/lib/supabase/server.ts ONLY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SENTRY_DSN                     # sentry.client.config.ts ONLY
SENTRY_DSN                                 # instrumentation.ts ONLY
SENTRY_ORG / SENTRY_PROJECT               # next.config.ts ONLY
RATE_LIMIT_REQUESTS_PER_HOUR              # default: 10
```

---

## Non-Negotiable Rules
- TypeScript strict — no `any`
- No direct commits to main — PRs only
- Zod schemas in `src/lib/validation/schemas.ts` only — never inline
- Error codes/messages from `src/lib/errors/messages.ts` — never hardcode
- `ANTHROPIC_API_KEY` → `src/lib/anthropic/client.ts` only
- `SUPABASE_SECRET_KEY` → `src/lib/supabase/server.ts` only
- No `dangerouslySetInnerHTML`

---

## Stack
Next.js 16 App Router · TypeScript strict · Supabase · Claude Haiku 3.5 · `@react-pdf/renderer` · Zod · Tailwind · Recharts · Sentry · Vercel

---

## Testing
- Unit tests (`npm test`): pure functions only — schemas, scoring, utils. No mocking internal code.
- AI regression (`npm run test:ai`): after every agent/prompt/scoring change. Flag drift > 10 pts.
- TDD: red → green → refactor. Test files co-located as `*.test.ts`.
