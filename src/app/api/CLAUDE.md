# API Routes — CLAUDE.md

Rules for all API route handlers under `src/app/api/`.

---

## Required Reading
- `docs/SCHEMAS.md` — request/response schemas for all routes
- `src/lib/errors/messages.ts` — all error codes, statuses, and messages (source of truth)
- `docs/ERROR_STATES.md` — UI behavior details only (toast specs, recovery actions)
- `docs/AGENT_ARCHITECTURE.md` — compliance check flow (for `/api/compliance`)

---

## API Routes
```
POST /api/compliance          — Run compliance check
GET  /api/submissions         — List user submissions
GET  /api/submissions/[id]    — Get single submission
DELETE /api/submissions/[id]  — Delete submission
DELETE /api/submissions       — Delete all submissions
POST /api/report              — Generate PDF report
GET  /api/health              — Health check
```

## Non-Negotiable Rules

**Every route must:**
1. Verify authenticated session server-side before any processing
2. Validate request body against Zod schema (from `src/lib/validation/schemas.ts`)
3. Use `errorResponse()` from `src/lib/errors/messages.ts` — never hardcode error messages
4. Use parameterized Supabase queries (never string interpolation)

**Compliance route specifically:**
1. Check rate limit for user
2. If file upload: extract text, then delete file from memory immediately
3. Sanitize text (strip HTML, scripts)
4. Wrap text in `<document>...</document>` XML delimiters
5. Fire three agents in parallel → validate outputs → fire judge
6. Judge confidence < 0.6 → retry (max 2)
7. Calculate weighted final score → store in Supabase → return response

**Database:**
- All tables have RLS — `auth.uid() = user_id`
- Read `docs/DATABASE.md` for schema details
- Hard-delete on submission deletion, not soft-delete
