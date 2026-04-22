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

---

## OWASP Top 10 Coverage

- **A01 Broken Access Control:** RLS on all tables (`auth.uid() = user_id`), session verified on every API route
- **A02 Cryptographic Failures:** JWT/hashing via Supabase Auth, API keys isolated to single files
- **A03 Injection:** Zod on all inputs, parameterized queries only, `<document>` XML delimiters for prompt injection
- **A04 Insecure Design:** Agent outputs schema-validated, scores recalculated from gaps (never trust agent)
- **A05 Security Misconfiguration:** Secrets in env vars only, no hardcoded keys, enforced in CLAUDE.md rules
- **A06 Vulnerable Components:** `npm audit --audit-level=moderate` in CI (`pr.yml`, `deploy.yml`)
- **A07 Auth Failures:** Supabase Auth with JWT expiry, rate limiting (10 checks/user/hour)
- **A08 Data Integrity Failures:** Zod schema validation on all agent outputs, judge cross-validates pillar consistency
- **A09 Logging/Monitoring Failures:** Sentry error monitoring (`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`)
- **A10 SSRF:** No outbound requests from user input — agents only call Anthropic API with sanitized text
