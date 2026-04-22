# Sprint 1 Retrospective — SR 11-7 Core

**Sprint dates:** Weeks 1–2
**Issues completed:** 8/8

---

## What went well

- **Single-agent-first approach paid off** — proving Conceptual Soundness end-to-end before parallelizing meant the compliance route, Zod schemas, and agent output structure were all validated early. Sprint 2 parallelization was mostly additive.
- **Supabase accelerated auth** — Google OAuth, email/password, RLS, and JWT session management all working within the first sprint. No custom auth code to maintain.
- **CLAUDE.md from day one** — having non-negotiable rules (TypeScript strict, Zod in one file, error codes from messages.ts) prevented drift as the codebase grew. Sub-folder CLAUDE.mds kept domain rules close to the code.
- **Zod as single source of truth** — caught several type mismatches between API boundaries and agent outputs during integration. Would have been silent bugs without runtime validation.

## What didn't go well

- **Direct push to main broke the deploy** — early in the sprint, a commit went directly to main and caused a broken build. Took 30 minutes to untangle. Led to the PreToolUse hook and branch protection rule.
- **No CI pipeline yet** — all verification was manual (`npm run build`, `npm run typecheck`). Lint errors slipped through that would have been caught by automated checks.
- **Landing page was an afterthought** — S1-08 was deprioritized and rushed at the end. The initial version was functional but not polished.

## Action items for Sprint 2

- [ ] Never commit directly to main — enforce with hook + branch protection
- [ ] Start planning CI/CD (moved to Sprint 3 due to scope)
- [ ] Split large issues into backend/frontend when they touch both API routes and UI
- [ ] Derek joins for Sprint 2 — divide work across agent infrastructure vs. user-facing features
