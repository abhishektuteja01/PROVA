# Errors — CLAUDE.md

Rules for error handling across the app.

---

## Source of Truth
- `src/lib/errors/messages.ts` — all error codes, HTTP statuses, and user-facing messages
- `docs/ERROR_STATES.md` — human reference only (UI behavior, recovery actions, toast specs)

---

## Rules

- All error codes and messages are defined in `messages.ts` — never hardcode error messages inline
- Use the `errorResponse()` helper in all API routes
- VALIDATION_ERROR message can be overridden with the specific Zod issue message
- RATE_LIMIT_EXCEEDED message should be overridden with the actual minutes remaining
- For UI behavior details (toast durations, inline vs. full-page, recovery actions), read `docs/ERROR_STATES.md`
