# Validation — CLAUDE.md

Rules for all Zod schema and validation code in this folder.

---

## Required Reading
- `docs/SCHEMAS.md` — all Zod schemas for agent I/O and API boundaries
- `docs/AGENT_ARCHITECTURE.md` — agent/judge output schema definitions

---

## Non-Negotiable Rules

- **All Zod schemas live in `schemas.ts` only** — never define schemas inline in route handlers, components, or agent code
- Never skip validation on any API boundary
- Every agent output validated against schema before passing to next stage
- Schema validation failure triggers retry (counts toward 2-retry limit)
- Runtime safety on top of TypeScript — Zod is the single source of truth
