# Security — CLAUDE.md

Rules for all security middleware in this folder.

---

## Required Reading
- `src/lib/errors/messages.ts` — error codes and messages (source of truth)
- `docs/AGENT_ARCHITECTURE.md` — prompt injection protection details

---

## Non-Negotiable Rules

**API key isolation:**
- `ANTHROPIC_API_KEY` — only in `src/lib/anthropic/client.ts`
- `SUPABASE_SECRET_KEY` — only in `src/lib/supabase/server.ts`

**Input sanitization:**
- Strip HTML tags and script-like content before processing
- All document text wrapped in `<document>...</document>` before passing to agents

**File uploads:**
- Extension + MIME type validated server-side (double check)
- Accepted: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Max size: 10MB, enforced server-side
- Memory only — never written to disk
- Original file deleted from memory immediately after text extraction

**Rate limiting:**
- Default: 10 compliance checks per user per hour
- Configurable via `RATE_LIMIT_REQUESTS_PER_HOUR` env var
- Rate limit exceeded → clear error message with reset time

**Session security:**
- All API routes verify session server-side before any processing
- JWT expiry managed by Supabase Auth
- RLS enforced on all database tables
