# Prova — GitHub Issues Spec
**For use with GitHub Projects. All three sprints. Mid-level granularity.**
**Each issue is self-contained — safe to drop directly into Claude for implementation.**

---

## How to Use This Document

1. Create a GitHub Project named **"Prova"** with a Board view and columns: `Backlog → In Progress → In Review → Done`
2. Create the labels listed below first
3. Create each issue exactly as written — title, body, labels, milestone
4. Create milestones: `Sprint 1 (Mar 19–29)`, `Sprint 2 (Mar 30–Apr 9)`, `Sprint 3 (Apr 10–19)`

---

## Labels to Create First

| Label Name | Color | Description |
|---|---|---|
| `sprint-1` | `#0075ca` | Sprint 1: Mar 19–29 |
| `sprint-2` | `#e4e669` | Sprint 2: Mar 30–Apr 9 |
| `sprint-3` | `#d93f0b` | Sprint 3: Apr 10–19 |
| `backend` | `#5319e7` | API routes, server logic, DB |
| `frontend` | `#0e8a16` | React components, pages, UI |
| `ai` | `#b60205` | Agent prompts, orchestration, scoring |
| `infra` | `#c2e0c6` | CI/CD, Vercel, monitoring |
| `security` | `#e11d48` | Auth, RLS, sanitization, rate limiting |
| `database` | `#f9d0c4` | Supabase schema, migrations, RLS |
| `testing` | `#bfd4f2` | Unit tests, AI regression, synthetic docs |

---

---

# SPRINT 1 ISSUES
**Focus: Auth, document input, single agent end-to-end**

---

## Issue S1-01: Project Setup — Next.js, TypeScript, Supabase, Tailwind, Fonts

**Labels:** `sprint-1` `backend` `frontend`
**Milestone:** Sprint 1 (Mar 19–29)

### Overview
Bootstrap the entire Prova project from scratch. This is the foundation every other issue depends on. Complete this before any other Sprint 1 issue is started.

### Context
Prova is a Next.js 16 App Router monolith deployed on Vercel. Frontend and backend coexist in one repo. All AI logic is server-side only (API key never touches the client). Read `CLAUDE.md` before starting.

### Acceptance Criteria

**Project structure:**
- [x] Next.js 16 App Router initialized with TypeScript strict mode (`"strict": true` in `tsconfig.json` — no `any` types ever)
- [x] Folder structure matches `PRD.md` Section 15 exactly:
  - `src/app/(auth)/` — auth route group (no navbar)
  - `src/app/(dashboard)/` — authenticated route group (with navbar)
  - `src/app/api/` — API routes
  - `src/components/ui/`, `src/components/dashboard/`, `src/components/compliance/`, `src/components/layout/`, `src/components/report/`
  - `src/lib/agents/`, `src/lib/scoring/`, `src/lib/parsers/`, `src/lib/validation/`, `src/lib/security/`, `src/lib/supabase/`, `src/lib/anthropic/`
  - `src/types/index.ts`
  - `tests/agents/`, `tests/scoring/`, `tests/api/`, `tests/synthetic/documents/`

**Dependencies installed:**
- [x] `@supabase/supabase-js` and `@supabase/ssr`
- [x] `@anthropic-ai/sdk`
- [x] `@react-pdf/renderer`
- [x] `pdf-parse` and `@types/pdf-parse`
- [x] `mammoth`
- [x] `zod`
- [x] `recharts`
- [x] `@sentry/nextjs`
- [x] `tailwindcss`
- [x] Jest + `ts-jest` for testing

**Fonts (self-hosted, not Google Fonts CDN):**
- [x] Playfair Display (for headings)
- [x] IBM Plex Mono (for scores and numbers)
- [x] Geist (for UI labels)
- [ ] All loaded in `src/app/layout.tsx` via `next/font/local`
- [x] Font variables wired into `tailwind.config.ts`

**CSS variables in `src/app/globals.css`:**
```css
--color-bg-primary:     #0A0F1E
--color-bg-secondary:   #111827
--color-bg-tertiary:    #1F2937
--color-text-primary:   #F9FAFB
--color-text-secondary: #9CA3AF
--color-accent:         #3B82F6
--color-compliant:      #10B981
--color-warning:        #F59E0B
--color-critical:       #EF4444
--color-border:         #1F2937
```
- [x] These are the ONLY color definitions — never hardcode hex values anywhere else in the codebase

**Environment variables:**
- [x] `.env.local.example` created with all variables from `CLAUDE.md` (no values, just keys + descriptions)
- [x] `.env.local` in `.gitignore`
- [x] `ANTHROPIC_API_KEY` referenced only in `src/lib/anthropic/client.ts`
- [x] `SUPABASE_SECRET_KEY` referenced only in `src/lib/supabase/server.ts`

**npm scripts:**
- [x] `npm run dev` — starts dev server
- [x] `npm run build` — type check + build
- [x] `npm run lint` — ESLint
- [x] `npm run typecheck` — tsc --noEmit
- [x] `npm test` — Jest
- [x] `npm run test:ai` — placeholder script (echo "AI test suite not yet implemented") — will be wired up in Sprint 3

**Health check:**
- [ ] `GET /api/health` returns `{ status: "ok", timestamp: "<ISO string>" }` with HTTP 200

**Verification:**
- [x] `npm run build` passes with zero TypeScript errors
- [x] `npm run lint` passes clean
- [x] `GET /api/health` returns 200

---

## Issue S1-02: Supabase Schema, RLS Policies, and Client Setup

**Labels:** `sprint-1` `database` `security` `backend`
**Milestone:** Sprint 1 (Mar 19–29)

### Overview
Create the complete Supabase database schema, all RLS policies, and the server/client Supabase wrappers. This is required before auth and the compliance API can be built.

### Context
Prova uses Supabase (PostgreSQL + Auth + RLS). Row Level Security is non-negotiable — every table is locked to `auth.uid() = user_id`. The service role key is used server-side only. The anon key is safe for the client because RLS protects all data. Read `ARCHITECTURE.md` Section 4 (Database Relationships) before starting.

### Database Tables to Create

**`models` table:**
```sql
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**`submissions` table:**
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  document_text TEXT NOT NULL,
  conceptual_score INTEGER,
  outcomes_score INTEGER,
  monitoring_score INTEGER,
  final_score INTEGER,
  gap_analysis JSONB,
  judge_confidence NUMERIC(3,2),
  assessment_confidence_label TEXT CHECK (assessment_confidence_label IN ('High','Medium','Low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**`gaps` table:**
```sql
CREATE TABLE gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pillar TEXT NOT NULL CHECK (pillar IN ('conceptual_soundness','outcomes_analysis','ongoing_monitoring')),
  element_code TEXT NOT NULL,
  element_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical','Major','Minor')),
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**`user_preferences` table:**
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  show_overview_panel BOOLEAN NOT NULL DEFAULT true,
  show_model_inventory BOOLEAN NOT NULL DEFAULT true,
  show_score_progression BOOLEAN NOT NULL DEFAULT true,
  show_recent_activity BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**`evals` table (for AI regression tracking):**
```sql
CREATE TABLE evals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  input_text_hash TEXT NOT NULL,
  agent_outputs JSONB NOT NULL,
  judge_output JSONB NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  total_latency_ms INTEGER,
  model_used TEXT NOT NULL DEFAULT 'claude-haiku-3-5-20241022',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### RLS Policies

Enable RLS and create policies for every table:

```sql
-- models
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own models"
  ON models FOR ALL USING (auth.uid() = user_id);

-- submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own submissions"
  ON submissions FOR ALL USING (auth.uid() = user_id);

-- gaps
ALTER TABLE gaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own gaps"
  ON gaps FOR ALL USING (auth.uid() = user_id);

-- user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own preferences"
  ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- evals: no user-level access (admin only in future)
ALTER TABLE evals ENABLE ROW LEVEL SECURITY;
-- No public policy — only accessible via service role
```

### Indexes
```sql
CREATE INDEX idx_models_user_id ON models(user_id);
CREATE INDEX idx_submissions_model_id ON submissions(model_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_gaps_submission_id ON gaps(submission_id);
CREATE INDEX idx_gaps_user_id ON gaps(user_id);
```

### Supabase Client Files

**`src/lib/supabase/client.ts`** — browser client (uses anon key):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** — server-side client (uses service role key for writes, session client for user-scoped reads):
- Export a `createServerClient()` that uses `@supabase/ssr` with cookies for session-aware calls
- Export a `createServiceClient()` that uses `SUPABASE_SECRET_KEY` for admin writes (inserting submissions, gaps, evals)
- `SUPABASE_SECRET_KEY` must NOT appear in any other file

**`src/lib/supabase/middleware.ts`** — session refresh helper for Next.js middleware

### Acceptance Criteria
- [ ] All 5 tables created in Supabase with correct column types and constraints
- [ ] RLS enabled and policies applied on all tables
- [ ] All indexes created
- [x] `src/lib/supabase/client.ts` — browser client, anon key only
- [x] `src/lib/supabase/server.ts` — server client + service client, `SUPABASE_SECRET_KEY` isolated here only
- [x] `src/lib/supabase/middleware.ts` — session refresh helper
- [x] No Supabase keys referenced in any other file

---

## Issue S1-03: Authentication — Email/Password, Google OAuth, Middleware Guard

**Labels:** `sprint-1` `backend` `frontend` `security`
**Milestone:** Sprint 1 (Mar 19–29)

### Overview
Implement full authentication: email/password login, Google OAuth, password reset, Next.js middleware route guard, and the three auth pages. Users must be authenticated to access anything in `/(dashboard)`.

### Context
Auth is via Supabase Auth with JWT sessions. The middleware in `src/proxy.ts` (called `middleware.ts` at root) must redirect unauthenticated users to `/login` before any dashboard page renders. All API routes also re-verify session server-side (defense in depth — this is handled in each API route, not here). Read `ARCHITECTURE.md` Section 3 (Authentication Flow).

### Pages to Build

**`/login`** (`src/app/(auth)/login/page.tsx`):
- Email + password fields
- "Sign in with Google" button
- Link to `/signup`
- Link to `/reset-password`
- On success → redirect to `/dashboard`
- Error states: invalid credentials, email not confirmed, network error
- No navbar (auth route group has no layout with navbar)

**`/signup`** (`src/app/(auth)/signup/page.tsx`):
- Email + password + confirm password fields
- "Sign up with Google" button
- Link back to `/login`
- On success → redirect to `/dashboard` (Supabase auto-confirms for OAuth; email signup may require confirmation depending on Supabase project settings)
- Error states: email already in use, passwords don't match, weak password

**`/reset-password`** (`src/app/(auth)/reset-password/page.tsx`):
- Email field only
- "Send reset link" button
- On success → show confirmation message (do not redirect)
- Error states: email not found, network error

### Middleware (`src/proxy.ts` — Next.js reads this as `middleware.ts`):
```typescript
// Protected routes: all routes under /(dashboard)
// Public routes: /, /login, /signup, /reset-password, /api/health
// Logic:
//   - Refresh Supabase session on every request (use src/lib/supabase/middleware.ts)
//   - If accessing a protected route without a valid session → redirect to /login
//   - If accessing /login or /signup with a valid session → redirect to /dashboard
```

### Design Requirements
- Follow `PRD.md` Section 8 design system exactly
- Background: `var(--color-bg-primary)` (#0A0F1E)
- Cards/panels: `var(--color-bg-secondary)` (#111827)
- All text in Geist
- CTA buttons in `var(--color-accent)` (#3B82F6)
- Loading states: skeleton screens (never spinners)
- No `dangerouslySetInnerHTML` anywhere

### Acceptance Criteria
- [x] `/login` renders and functions (email/password + Google OAuth)
- [x] `/signup` renders and functions
- [x] `/reset-password` renders and functions
- [x] Middleware redirects unauthenticated users from any `/dashboard*` route to `/login`
- [x] Middleware redirects authenticated users away from `/login` and `/signup` to `/dashboard`
- [x] Supabase session is refreshed on every middleware invocation (prevents stale JWT)
- [x] All error states handled with user-visible messages (no silent failures)
- [x] `npm run build` passes with zero TypeScript errors

---

## Issue S1-04: Zod Schemas — All Validation Types

**Labels:** `sprint-1` `backend` `ai`
**Milestone:** Sprint 1 (Mar 19–29)

### Overview
Define all Zod validation schemas in a single file: `src/lib/validation/schemas.ts`. This file is the single source of truth for every type used at API boundaries and agent I/O. No schemas are ever defined inline in route handlers or agent files.

### Context
TypeScript strict mode is enforced. `any` types are forbidden. Every API boundary and agent output must be validated before use. Zod schema validation failure on agent output triggers a retry (counts toward the max 2 retries). Read `PRD.md` Section 14.1 and 14.2 for the exact JSON shapes.

### Schemas to Define

**Agent output schema (used by all 3 pillar agents):**
```typescript
export const GapSchema = z.object({
  element_code: z.string(),
  element_name: z.string(),
  severity: z.enum(['Critical', 'Major', 'Minor']),
  description: z.string(),
  recommendation: z.string(),
})

export const AgentOutputSchema = z.object({
  pillar: z.enum(['conceptual_soundness', 'outcomes_analysis', 'ongoing_monitoring']),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  gaps: z.array(GapSchema),
  summary: z.string(),
})

export type AgentOutput = z.infer<typeof AgentOutputSchema>
export type Gap = z.infer<typeof GapSchema>
```

**Judge output schema:**
```typescript
export const AgentFeedbackSchema = z.object({
  complete: z.boolean(),
  issues: z.array(z.string()),
})

export const JudgeOutputSchema = z.object({
  confidence: z.number().min(0).max(1),
  confidence_label: z.enum(['High', 'Medium', 'Low']),
  is_consistent: z.boolean(),
  anomaly_detected: z.boolean(),
  anomaly_description: z.string().nullable(),
  agent_feedback: z.object({
    conceptual_soundness: AgentFeedbackSchema,
    outcomes_analysis: AgentFeedbackSchema,
    ongoing_monitoring: AgentFeedbackSchema,
  }),
  retry_recommended: z.boolean(),
})

export type JudgeOutput = z.infer<typeof JudgeOutputSchema>
```

**Compliance API request schema:**
```typescript
export const ComplianceRequestSchema = z.object({
  modelName: z.string().min(1).max(200),
  documentText: z.string().min(100).max(500000).optional(),
  // file is handled as multipart — not in this schema
})
```

**Compliance API response schema:**
```typescript
export const ComplianceResponseSchema = z.object({
  submissionId: z.string().uuid(),
  modelName: z.string(),
  versionNumber: z.number(),
  conceptualScore: z.number(),
  outcomesScore: z.number(),
  monitoringScore: z.number(),
  finalScore: z.number(),
  status: z.enum(['Compliant', 'Needs Improvement', 'Critical Gaps']),
  gaps: z.array(GapSchema),
  judgeConfidence: z.number(),
  assessmentConfidenceLabel: z.enum(['High', 'Medium', 'Low']),
  retryCount: z.number(),
})

export type ComplianceResponse = z.infer<typeof ComplianceResponseSchema>
```

**Scoring types:**
```typescript
export const ScoringResultSchema = z.object({
  csScore: z.number().min(0).max(100),
  oaScore: z.number().min(0).max(100),
  omScore: z.number().min(0).max(100),
  finalScore: z.number().min(0).max(100),
  status: z.enum(['Compliant', 'Needs Improvement', 'Critical Gaps']),
})

export type ScoringResult = z.infer<typeof ScoringResultSchema>
```

**User preferences schema:**
```typescript
export const UserPreferencesSchema = z.object({
  show_overview_panel: z.boolean().default(true),
  show_model_inventory: z.boolean().default(true),
  show_score_progression: z.boolean().default(true),
  show_recent_activity: z.boolean().default(true),
})

export type UserPreferences = z.infer<typeof UserPreferencesSchema>
```

### Acceptance Criteria
- [x] All schemas defined in `src/lib/validation/schemas.ts` — no schemas anywhere else
- [x] All TypeScript types exported via `z.infer<>` — no manually duplicated types
- [x] `AgentOutputSchema` validates pillar, score (0–100), confidence (0–1), gaps array, summary string
- [x] `JudgeOutputSchema` validates all judge fields including nested `agent_feedback`
- [x] File compiles with zero TypeScript errors under strict mode
- [x] Every schema export is tested in `tests/scoring/calculator.test.ts` (or a dedicated schema test file) with at least one valid and one invalid fixture

---

## Issue S1-05: Input Sanitization and File Parsing

**Labels:** `sprint-1` `backend` `security`
**Milestone:** Sprint 1 (Mar 19–29)

### Overview
Implement all input sanitization and file parsing logic. This runs before any text reaches an AI agent. Both PDF and DOCX parsing happen in memory only — files are never written to disk.

### Files to Create

**`src/lib/security/sanitize.ts`:**
```typescript
// sanitizeText(raw: string): string
// - Strip all HTML tags (< ... >)
// - Strip script-like patterns (e.g. <script, javascript:, onerror=)
// - Normalize whitespace
// - Return cleaned string
// Does NOT truncate — length limits are enforced at the Zod schema layer

// validateFileType(filename: string, mimeType: string): boolean
// - Accepted extensions: .pdf, .docx
// - Accepted MIME types:
//     application/pdf
//     application/vnd.openxmlformats-officedocument.wordprocessingml.document
// - Returns true only if BOTH extension AND MIME type match
// - Never trusts client-supplied MIME type alone
```

**`src/lib/parsers/pdf.ts`:**
```typescript
// parsePDF(buffer: Buffer): Promise<string>
// - Uses pdf-parse to extract text from buffer
// - Returns extracted text string
// - File buffer is passed in — never a file path (in-memory only)
// - Throws a typed error if parsing fails
```

**`src/lib/parsers/docx.ts`:**
```typescript
// parseDOCX(buffer: Buffer): Promise<string>
// - Uses mammoth to extract raw text (not HTML) from buffer
// - Returns extracted text string
// - File buffer is passed in — never a file path (in-memory only)
// - Throws a typed error if parsing fails
```

**`src/lib/security/rateLimit.ts`:**
```typescript
// checkRateLimit(userId: string): Promise<{ allowed: boolean; resetAt: Date }>
// - Checks how many compliance checks this user has made in the past hour
// - Limit: process.env.RATE_LIMIT_REQUESTS_PER_HOUR (default: 10)
// - Implementation: in-memory Map<userId, timestamp[]> is acceptable for MVP
//   (Vercel serverless caveat: state resets per cold start — acceptable for Sprint 1)
// - Returns { allowed: true } or { allowed: false, resetAt: <Date when oldest request expires> }
```

### Security Rules (Hard Requirements)
- Files processed in memory only — never call `fs.writeFile` or any disk write
- `validateFileType` must check BOTH extension AND MIME type — never just one
- HTML stripping must run before text is stored in the database AND before it's sent to agents
- Rate limit uses `userId` from the server-side session — never from a client-supplied header

### Acceptance Criteria
- [x] `sanitizeText()` strips `<script>`, `<img>`, all HTML tags, inline JS patterns
- [x] `sanitizeText()` preserves normal text content (doesn't mangle plain prose)
- [x] `validateFileType()` rejects `.exe` with PDF MIME type, `.docx` with wrong MIME, etc.
- [x] `parsePDF()` returns string from buffer — unit tested with a tiny test PDF buffer
- [x] `parseDOCX()` returns string from buffer — unit tested with a tiny test DOCX buffer
- [x] `checkRateLimit()` returns `allowed: false` after N requests in 1 hour
- [x] No file paths or `fs` module usage in parsers — buffers only
- [x] All functions fully typed, no `any`

---

## Issue S1-06: Anthropic Client and Single Agent (Conceptual Soundness) — End-to-End

**Labels:** `sprint-1` `ai` `backend`
**Milestone:** Sprint 1 (Mar 19–29)

### Overview
Wire up the Anthropic SDK client, implement the Conceptual Soundness agent, and get the first end-to-end compliance check working (single agent, no judge, no scoring yet). This is the core AI flow proof-of-concept for Sprint 1.

### Context
The model string is `claude-haiku-3-5-20241022` — exact, no aliases. Max tokens per agent is 1000. The agent system prompt and user prompt template are defined verbatim in `AGENT_PROMPTS.md`. Do NOT retype them — copy them exactly. The document must be wrapped in `<document>...</document>` XML delimiters before passing to the agent. Read `AGENT_PROMPTS.md` Agent 1 section completely before writing any code.

### Files to Create

**`src/lib/anthropic/client.ts`** — the ONLY file that references `ANTHROPIC_API_KEY`:
```typescript
import Anthropic from '@anthropic-ai/sdk'

// This is the only file in the codebase that references ANTHROPIC_API_KEY
// Do not import this client in any client-side component
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})
```

**`src/lib/agents/conceptualSoundness.ts`:**
```typescript
// assessConceptualSoundness(
//   documentText: string,  // already sanitized, NOT yet wrapped in XML
//   retryContext?: string  // optional context from previous failed attempt
// ): Promise<AgentOutput>
//
// Implementation:
// 1. Wrap documentText: `<document>\n${documentText}\n</document>`
// 2. Build user prompt from AGENT_PROMPTS.md Agent 1 User Prompt Template
//    (replace {modelName} and {documentText} with actual values)
// 3. Call anthropic.messages.create({
//      model: 'claude-haiku-3-5-20241022',  // EXACT string — no aliases
//      max_tokens: 1000,
//      system: <Agent 1 system prompt from AGENT_PROMPTS.md — copied verbatim>,
//      messages: [{ role: 'user', content: userPrompt }]
//    })
// 4. Parse response.content[0].text as JSON
// 5. Validate against AgentOutputSchema (Zod)
// 6. Return typed AgentOutput
// 7. Throw typed error on parse failure or schema validation failure
```

**`src/lib/agents/orchestrator.ts`** (Sprint 1 version — single agent only):
```typescript
// runCompliance(documentText: string, modelName: string): Promise<{
//   csOutput: AgentOutput,
//   retryCount: number
// }>
//
// Sprint 1 scope: just calls assessConceptualSoundness and returns result
// Sprint 2 will add the other two agents, judge, and retry loop
```

### Prompt Copy Rules
The system prompt for Agent 1 must be copied **verbatim** from `AGENT_PROMPTS.md`. It includes:
- SECURITY RULE (prompt injection defense)
- ANTI-BIAS RULES (4 rules — do not remove any)
- ASSESSMENT PROCESS (CS-01 through CS-07 with scoring criteria)
- SCORING RULES
- CONFIDENCE SCORING
- OUTPUT FORMAT with exact JSON shape

Do not paraphrase, shorten, or modify any part of the prompt. Run `npm run test:ai` after wiring up (it will be a no-op placeholder until Sprint 3 wires real tests — that's fine).

### Acceptance Criteria
- [x] `src/lib/anthropic/client.ts` is the ONLY file containing `ANTHROPIC_API_KEY`
- [x] Agent 1 system prompt matches `AGENT_PROMPTS.md` Agent 1 system prompt verbatim
- [x] Agent 1 user prompt template matches `AGENT_PROMPTS.md` Agent 1 user prompt template verbatim
- [x] Document text is wrapped in `<document>...</document>` before every API call
- [x] Model string is `claude-haiku-3-5-20241022` — verified, not an alias
- [x] `max_tokens` is 1000
- [x] Response is parsed as JSON and validated against `AgentOutputSchema`
- [x] Typed error thrown on JSON parse failure
- [x] Typed error thrown on Zod validation failure
- [ ] Manual test: call `assessConceptualSoundness()` with a short model doc string and verify valid `AgentOutput` is returned

---

## Issue S1-07: POST /api/compliance — Sprint 1 Version (Single Agent)

**Labels:** `sprint-1` `backend` `security`
**Milestone:** Sprint 1 (Mar 19–29)

### Overview
Implement the `POST /api/compliance` route for Sprint 1: takes a model document (text paste or file upload), runs the Conceptual Soundness agent, saves the result to Supabase, and returns a response. The full parallel 3-agent flow is Sprint 2.

### Context
This is the most security-critical route in Prova. Read `ARCHITECTURE.md` Section 2 (Data Flow) completely. Key constraints:
- Session must be verified server-side before any processing
- Rate limit must be checked before calling Claude
- Files processed in memory only — never written to disk
- All text sanitized before storage and before agent call
- Document wrapped in XML delimiters before agent call
- All Zod schemas from `src/lib/validation/schemas.ts` — never inline

### Implementation Steps (in exact order)

```
POST /api/compliance

1. createServerClient() → verify session → get userId
   If no session → 401 { error: "UNAUTHORIZED" }

2. checkRateLimit(userId)
   If not allowed → 429 { error: "RATE_LIMIT_EXCEEDED", resetAt: <ISO string> }

3. Parse request:
   - If Content-Type is multipart/form-data:
       - Extract file buffer + modelName from FormData
       - Validate file type via validateFileType(filename, mimeType)
         If invalid → 400 { error: "INVALID_FILE_TYPE" }
       - Parse buffer via parsePDF() or parseDOCX() based on extension
         If parse fails → 400 { error: "FILE_PARSE_ERROR" }
       - documentText = parsed text
   - If Content-Type is application/json:
       - Validate body against ComplianceRequestSchema (Zod)
         If invalid → 400 { error: "INVALID_REQUEST", details: zodError }
       - documentText = body.documentText

4. sanitizeText(documentText) → sanitizedText

5. Call assessConceptualSoundness(sanitizedText, modelName)
   If agent throws → 500 { error: "AGENT_ERROR" }

6. Upsert to models table:
   - SELECT id FROM models WHERE user_id = userId AND model_name = modelName
   - If exists → use existing id, increment version
   - If not exists → INSERT new row, version = 1

7. INSERT to submissions:
   - model_id, user_id, version_number, document_text: sanitizedText,
   - conceptual_score: csOutput.score
   - outcomes_score: null (Sprint 2)
   - monitoring_score: null (Sprint 2)
   - final_score: csOutput.score (Sprint 1 placeholder)
   - gap_analysis: JSON.stringify(csOutput.gaps)
   - judge_confidence: null (Sprint 2)
   - assessment_confidence_label: null (Sprint 2)

8. INSERT to gaps table (one row per gap in csOutput.gaps):
   - submission_id, user_id, pillar: 'conceptual_soundness',
   - element_code, element_name, severity, description, recommendation

9. Return 200:
   {
     submissionId: <uuid>,
     modelName,
     versionNumber,
     conceptualScore: csOutput.score,
     outcomesScore: null,
     monitoringScore: null,
     finalScore: csOutput.score,
     status: <derived from finalScore>,
     gaps: csOutput.gaps,
     judgeConfidence: null,
     assessmentConfidenceLabel: null,
     retryCount: 0
   }
```

### Error Response Format
All error responses must follow this shape exactly:
```json
{ "error": "<ERROR_CODE>", "message": "<human readable>", "details": <optional> }
```
Error codes: `UNAUTHORIZED`, `RATE_LIMIT_EXCEEDED`, `INVALID_FILE_TYPE`, `FILE_PARSE_ERROR`, `INVALID_REQUEST`, `AGENT_ERROR`, `DATABASE_ERROR`

### Acceptance Criteria
- [x] Session verified server-side as first operation — nothing executes before this check
- [x] Rate limit checked before any Claude API call
- [x] File upload: extension + MIME type both validated, buffer only (no disk writes)
- [x] Text paste: Zod validated against `ComplianceRequestSchema`
- [x] `sanitizeText()` called before storage AND before agent call
- [x] Document wrapped in `<document>...</document>` inside the agent function (not here)
- [x] Submission + gaps written to Supabase with correct user_id (from session, never client)
- [x] All error responses use the standard error shape
- [x] `npm run build` passes with zero TypeScript errors
- [ ] Manual test: POST with a text payload returns a valid response with `submissionId`

---

## Issue S1-08: Landing Page and Base Layout

**Labels:** `sprint-1` `frontend`
**Milestone:** Sprint 1 (Mar 19–29)

### Overview
Build the public landing page (`/`) and the shared layout for authenticated routes (navbar + route group layout). This is the visual first impression of Prova and sets the design language for all subsequent pages.

### Context
Prova's design direction from `PRD.md` Section 8: banking-appropriate refined minimalism. Data is the hero. Reference the color palette and typography from that section. Key rules:
- All scores/numbers: IBM Plex Mono
- Headings: Playfair Display
- Labels/body: Geist
- Colors: CSS variables only — never hardcode hex
- Loading states: skeleton screens only (never spinners)
- No `dangerouslySetInnerHTML` anywhere
- No Inter, Roboto, Arial, purple gradients, generic AI aesthetics

### Landing Page (`src/app/page.tsx`)
Content:
- Hero: "Know what's missing before regulators do." + brief description of Prova
- What it does: 3-pillar explanation (Conceptual Soundness, Outcomes Analysis, Ongoing Monitoring)
- CTA: "Get started" → `/signup`, "Sign in" → `/login`
- Footer: tagline + "For training and synthetic model documents only"

Visual requirements:
- Deep navy background (`var(--color-bg-primary)`)
- The three pillars shown with their SR 11-7 weights (40% / 35% / 25%)
- Compliance score shown as a large number in IBM Plex Mono
- Minimal animation: staggered fade-in on page load only

### Authenticated Layout (`src/app/(dashboard)/layout.tsx`)
- Renders navbar at top
- Auth guard: if no Supabase session → redirect to `/login` (server-side check in layout, as backup to middleware)
- Renders `{children}` below navbar

### Navbar (`src/components/layout/Navbar.tsx`)
Links:
- Dashboard → `/dashboard`
- New Check → `/check`
- History → `/submissions`
- Help → `/help`
- Settings → `/settings`

Right side:
- User email (from Supabase session)
- Sign out button (calls Supabase `signOut()`, redirects to `/`)

Active link styling: `var(--color-accent)` underline or highlight

### Acceptance Criteria
- [ ] Landing page renders at `/` with hero, 3-pillar section, and CTAs
- [ ] Landing page uses correct fonts, colors (CSS variables), and design system
- [ ] Navbar renders on all authenticated pages with correct links
- [ ] Active link highlighted correctly
- [ ] Sign out works and redirects to `/`
- [ ] `npm run build` passes with zero TypeScript errors

---

---

# SPRINT 2 ISSUES
**Focus: All three agents, judge, scoring, dashboard, PDF reports**

---

## Issue S2-01: Complete Parallel Agent System (Agents 2, 3, Orchestrator, Judge)

**Labels:** `sprint-2` `ai` `backend`
**Milestone:** Sprint 2 (Mar 30–Apr 9)

### Overview
Implement the remaining two pillar agents (Outcomes Analysis, Ongoing Monitoring), the Judge agent, and the full orchestrator with parallel execution and retry loop. This is the core intelligence of Prova.

### Context
All agent prompts are defined verbatim in `AGENT_PROMPTS.md`. Copy them exactly — do not paraphrase. The orchestrator runs all three agents in parallel via `Promise.all`, then passes their outputs to the Judge. If judge confidence < 0.6 and retries < 2, it loops. Maximum 3 total attempts (1 initial + 2 retries). Read `ARCHITECTURE.md` Section 5 (Agent Architecture Detail) completely before starting.

### Files to Create/Modify

**`src/lib/agents/outcomesAnalysis.ts`:**
```typescript
// assessOutcomesAnalysis(
//   documentText: string,
//   retryContext?: string
// ): Promise<AgentOutput>
//
// Same structure as assessConceptualSoundness.ts.
// System prompt: Agent 2 system prompt from AGENT_PROMPTS.md (verbatim copy).
// User prompt: Agent 2 user prompt template from AGENT_PROMPTS.md (verbatim copy).
// pillar in response must be "outcomes_analysis"
// model: 'claude-haiku-3-5-20241022', max_tokens: 1000
```

**`src/lib/agents/ongoingMonitoring.ts`:**
```typescript
// assessOngoingMonitoring(
//   documentText: string,
//   retryContext?: string
// ): Promise<AgentOutput>
//
// System prompt: Agent 3 system prompt from AGENT_PROMPTS.md (verbatim copy).
// User prompt: Agent 3 user prompt template from AGENT_PROMPTS.md (verbatim copy).
// pillar in response must be "ongoing_monitoring"
// model: 'claude-haiku-3-5-20241022', max_tokens: 1000
```

**`src/lib/agents/judge.ts`:**
```typescript
// runJudge(
//   modelName: string,
//   csOutput: AgentOutput,
//   oaOutput: AgentOutput,
//   omOutput: AgentOutput,
//   retryContext?: string  // from Retry Context Template in AGENT_PROMPTS.md
// ): Promise<JudgeOutput>
//
// System prompt: Judge Agent system prompt from AGENT_PROMPTS.md (verbatim copy).
// User prompt: Judge User Prompt Template from AGENT_PROMPTS.md (verbatim copy).
//   - {modelName}, {conceptualSoundnessOutput}, {outcomesAnalysisOutput},
//     {ongoingMonitoringOutput}, {retryContext} — replace all template vars
//   - {retryContext}: empty string on first attempt;
//     use Retry Context Template from AGENT_PROMPTS.md on retries
// model: 'claude-haiku-3-5-20241022', max_tokens: 1000
// Validate response against JudgeOutputSchema (Zod)
```

**`src/lib/agents/orchestrator.ts`** (full implementation replacing Sprint 1 stub):
```typescript
// runCompliance(
//   documentText: string,  // already sanitized, not yet XML-wrapped
//   modelName: string
// ): Promise<{
//   csOutput: AgentOutput,
//   oaOutput: AgentOutput,
//   omOutput: AgentOutput,
//   judgeOutput: JudgeOutput,
//   retryCount: number
// }>
//
// Algorithm:
// retryCount = 0
// previousIssues = []
//
// loop (max 3 iterations: retryCount 0, 1, 2):
//   retryContext = retryCount > 0
//     ? buildRetryContext(retryCount, previousIssues)  // uses Retry Context Template
//     : ''
//
//   [csOutput, oaOutput, omOutput] = await Promise.all([
//     assessConceptualSoundness(documentText, retryContext),
//     assessOutcomesAnalysis(documentText, retryContext),
//     assessOngoingMonitoring(documentText, retryContext),
//   ])
//
//   // Validate all three outputs against AgentOutputSchema
//   // If any validation fails → throw (caller handles retry)
//
//   judgeOutput = await runJudge(modelName, csOutput, oaOutput, omOutput,
//                                retryCount > 0 ? buildRetryContext(...) : '')
//
//   if judgeOutput.confidence >= 0.6 OR retryCount >= 2:
//     break
//
//   previousIssues = collectIssuesFromJudge(judgeOutput)
//   retryCount++
//
// return { csOutput, oaOutput, omOutput, judgeOutput, retryCount }
```

### Prompt Integrity Rules (Non-Negotiable)
- All four agent prompts must be copied verbatim from `AGENT_PROMPTS.md`
- Never remove the SECURITY RULE, ANTI-BIAS RULES, or CONFIDENCE SCORING sections
- After implementing, run `npm run test:ai` and verify no score drift > 10 points vs Sprint 1 baseline

### Acceptance Criteria
- [ ] `outcomesAnalysis.ts` calls Claude with Agent 2 system prompt verbatim, validates against `AgentOutputSchema`
- [ ] `ongoingMonitoring.ts` calls Claude with Agent 3 system prompt verbatim, validates against `AgentOutputSchema`
- [ ] `judge.ts` calls Claude with Judge system prompt verbatim, validates against `JudgeOutputSchema`
- [ ] `orchestrator.ts` runs all 3 agents in `Promise.all` (truly parallel)
- [ ] Retry loop: judge confidence < 0.6 AND retryCount < 2 → loops back with context
- [ ] After 2 retries with confidence still < 0.6 → accepts result with Low confidence (does not throw)
- [ ] `retryCount` returned and stored in response
- [ ] `npm run test:ai` passes (no score drift > 10 points)
- [ ] `npm run build` passes with zero TypeScript errors

---

## Issue S2-02: Scoring Calculator

**Labels:** `sprint-2` `ai` `backend`
**Milestone:** Sprint 2 (Mar 30–Apr 9)

### Overview
Implement the weighted scoring calculator that turns agent outputs into pillar scores and a final compliance score. This is pure math — no AI involved.

### Context
Scoring formula is defined in `PRD.md` Section 14.3. It must be implemented in `src/lib/scoring/calculator.ts` and covered by unit tests. The calculator is called after the orchestrator returns, before Supabase writes.

### Implementation

**`src/lib/scoring/calculator.ts`:**
```typescript
// calculateScores(
//   csOutput: AgentOutput,
//   oaOutput: AgentOutput,
//   omOutput: AgentOutput
// ): ScoringResult
//
// Per-pillar score: use the score field directly from AgentOutput
// (agents already apply deductions internally per their scoring rules)
// BUT: recalculate from gaps as a verification step:
//
// verifyPillarScore(agentScore: number, gaps: Gap[]): number
//   criticalCount = gaps.filter(g => g.severity === 'Critical').length
//   majorCount    = gaps.filter(g => g.severity === 'Major').length
//   minorCount    = gaps.filter(g => g.severity === 'Minor').length
//   calculated = 100 - (criticalCount * 20) - (majorCount * 10) - (minorCount * 5)
//   return Math.max(0, calculated)
// If agentScore !== calculated → log discrepancy, use calculated (never trust agent math blindly)
//
// finalScore = Math.round((csScore * 0.40) + (oaScore * 0.35) + (omScore * 0.25))
//
// status:
//   finalScore >= 80 → 'Compliant'
//   finalScore >= 60 → 'Needs Improvement'
//   else             → 'Critical Gaps'
//
// Returns: ScoringResult (validated against ScoringResultSchema)
```

### Unit Tests (`tests/scoring/calculator.test.ts`)

Test cases to cover:
1. Perfect score: 0 gaps on all pillars → finalScore = 100, status = 'Compliant'
2. All critical gaps (7 CS + 7 OA + 6 OM) → all pillar scores = 0, finalScore = 0, status = 'Critical Gaps'
3. Mixed gaps → verify weighted average math is correct
4. Score floor: more than 5 critical gaps → pillar score = 0 (not negative)
5. Status thresholds: finalScore = 80 → 'Compliant', 79 → 'Needs Improvement', 60 → 'Needs Improvement', 59 → 'Critical Gaps'
6. Verify discrepancy detection: agent reports score = 90, but gaps imply 80 → calculator returns 80

### Acceptance Criteria
- [ ] `calculateScores()` in `src/lib/scoring/calculator.ts`
- [ ] Recalculates from gaps rather than trusting agent-reported score
- [ ] Discrepancy logged (not thrown) when agent score ≠ calculated score
- [ ] Score floor of 0 enforced (never negative)
- [ ] Weighted average: CS×0.40 + OA×0.35 + OM×0.25, rounded to integer
- [ ] Status thresholds: ≥80 Compliant, ≥60 Needs Improvement, <60 Critical Gaps
- [ ] All 6 unit test cases pass
- [ ] `npm run build` passes with zero TypeScript errors

---

## Issue S2-03: Update POST /api/compliance — Full 3-Agent + Judge + Scoring Flow

**Labels:** `sprint-2` `backend` `ai`
**Milestone:** Sprint 2 (Mar 30–Apr 9)

### Overview
Update the compliance API route to use the full orchestrator (3 parallel agents + judge + retry loop) and the scoring calculator. Replace the Sprint 1 single-agent stub.

### Context
Read the complete data flow in `ARCHITECTURE.md` Section 2 again. The route structure is the same as Sprint 1, but step 5 onward changes significantly. Also adds eval logging.

### Changes to `src/app/api/compliance/route.ts`

Replace the agent call + Supabase write block (steps 5–9) with:

```
5. const { csOutput, oaOutput, omOutput, judgeOutput, retryCount }
     = await runCompliance(sanitizedText, modelName)

6. const scoring = calculateScores(csOutput, oaOutput, omOutput)

7. Upsert to models table (same as Sprint 1)

8. INSERT to submissions:
   - conceptual_score: scoring.csScore
   - outcomes_score:   scoring.oaScore
   - monitoring_score: scoring.omScore
   - final_score:      scoring.finalScore
   - gap_analysis:     JSON.stringify([...csOutput.gaps, ...oaOutput.gaps, ...omOutput.gaps])
   - judge_confidence: judgeOutput.confidence
   - assessment_confidence_label: judgeOutput.confidence_label

9. INSERT to gaps table:
   - All gaps from csOutput (pillar: 'conceptual_soundness')
   - All gaps from oaOutput (pillar: 'outcomes_analysis')
   - All gaps from omOutput (pillar: 'ongoing_monitoring')

10. INSERT to evals table:
    - submission_id: <new submission id>
    - input_text_hash: SHA-256 of sanitizedText (use crypto.createHash('sha256'))
    - agent_outputs: { cs: csOutput, oa: oaOutput, om: omOutput }
    - judge_output: judgeOutput
    - retry_count: retryCount
    - total_latency_ms: Date.now() - requestStartTime
    - model_used: 'claude-haiku-3-5-20241022'

11. Return 200 ComplianceResponse with all fields populated
```

### Acceptance Criteria
- [ ] `runCompliance()` called — not individual agent functions
- [ ] `calculateScores()` called with all three agent outputs
- [ ] All three pillar scores stored in submissions table
- [ ] All gaps from all three agents stored in gaps table with correct pillar label
- [ ] Eval record written to evals table after every successful check
- [ ] `assessment_confidence_label` stored and returned
- [ ] If judge reports `Low` confidence after max retries → response still returns 200 with `assessmentConfidenceLabel: 'Low'` (surface warning to user on frontend)
- [ ] `npm run build` passes with zero TypeScript errors

---

## Issue S2-04: Dashboard Page — Overview, Model Inventory, Score Chart, Activity Feed

**Labels:** `sprint-2` `frontend`
**Milestone:** Sprint 2 (Mar 30–Apr 9)

### Overview
Build the full dashboard at `/dashboard`. Four sections, all toggleable via user preferences. This is Sarah's (Model Risk Manager) primary view — it needs to communicate portfolio-level compliance status at a glance.

### Context
Design system: `PRD.md` Section 8. All sections are individually hideable per `PRD.md` Section 3.7. User preferences are stored in Supabase `user_preferences` table. Data comes from Supabase via server components or client-side fetch. Loading state: skeleton screens only (never spinners).

### Sections to Build

**1. Overview Panel (`src/components/dashboard/OverviewPanel.tsx`)**
Displays 4 stat cards:
- Total models submitted (count of distinct model names for this user)
- Average compliance score across all submissions (show in IBM Plex Mono, large)
- Count by status: Compliant / Needs Improvement / Critical Gaps
- Most recent submission: model name + score + timestamp

Color coding:
- Compliant count: `var(--color-compliant)` (#10B981)
- Needs Improvement: `var(--color-warning)` (#F59E0B)
- Critical Gaps: `var(--color-critical)` (#EF4444)

**2. Model Inventory Table (`src/components/dashboard/ModelInventoryTable.tsx`)**
Columns: Model Name · Version · Submission Date · CS Score · OA Score · OM Score · Final Score · Status · Actions

Requirements:
- Sorting: click column header to sort asc/desc
- Filtering: by status (dropdown), date range (two date inputs), score range (min/max)
- Pagination: 10 rows per page, with prev/next controls
- All scores in IBM Plex Mono
- Status as colored badge: green/amber/red per score thresholds
- Actions: "View" → `/submissions/[id]`, "Download Report" → `POST /api/report`
- Sharp corners on table (no border-radius) per design spec

**3. Score Progression Chart (`src/components/dashboard/ScoreProgressionChart.tsx`)**
- Recharts `LineChart`
- X-axis: version number, Y-axis: final compliance score (0–100)
- Only shown when selected model has 2+ submissions
- Model selector: dropdown to pick which model's history to display
- Line color: `var(--color-accent)` (#3B82F6)
- Axis labels in IBM Plex Mono

**4. Recent Activity Feed (`src/components/dashboard/RecentActivityFeed.tsx`)**
- Last 10 compliance checks
- Each item: model name · version · final score · status badge · relative timestamp
- Clicking an item → `/submissions/[id]`

### Data Fetching
All dashboard data fetched server-side in the page component or via client fetch to `/api/submissions`. Use the Supabase server client with the user's session.

### Skeleton Loading (`src/components/ui/Skeleton.tsx`)
- Each section has its own skeleton variant
- Shown while data loads
- Never use a spinner

### Dashboard Preferences
- Read `show_overview_panel`, `show_model_inventory`, `show_score_progression`, `show_recent_activity` from `user_preferences` table
- If no row exists for user → treat all as `true` (defaults)
- Sections not shown when preference is false

### Acceptance Criteria
- [ ] All four sections render with real Supabase data
- [ ] Empty states handled gracefully (e.g., "No submissions yet — run your first compliance check")
- [ ] Skeleton screens shown during load (no spinners)
- [ ] Model Inventory Table: sorting, filtering, pagination all work
- [ ] Score Progression Chart only visible when selected model has 2+ submissions
- [ ] Section visibility respects user preferences from Supabase
- [ ] All numbers/scores in IBM Plex Mono
- [ ] Design matches `PRD.md` Section 8 (colors, fonts, no spinners)
- [ ] `npm run build` passes with zero TypeScript errors

---

## Issue S2-05: New Compliance Check Page (`/check`)

**Labels:** `sprint-2` `frontend`
**Milestone:** Sprint 2 (Mar 30–Apr 9)

### Overview
Build the `/check` page where users submit model documentation for SR 11-7 compliance assessment. Two input methods: text paste or file upload. This is the primary action page for Alex (Junior Validator) and Raj (Model Developer).

### Components to Build

**`src/components/compliance/DocumentInput.tsx`**
- Toggle between "Paste Text" and "Upload File" modes
- Model Name field (required, max 200 chars)
- Character count display when in text mode
- Minimum 100 characters enforced before submit button enables

**`src/components/compliance/FileUpload.tsx`**
- Drag-and-drop zone + click-to-browse
- Accepted: `.pdf`, `.docx` only (enforce in `accept` attribute AND validate after selection)
- Max 10MB (enforce client-side with error message before upload)
- Show selected filename + size after selection
- Clear/remove file button

**Results display after submission:**
- Loading state: skeleton while waiting for API response (compliance checks take 10–30 seconds)
- On success → render `ComplianceResults`
- On `assessmentConfidenceLabel: 'Low'` → show amber banner: "Low confidence assessment — results may be less reliable. Consider resubmitting."
- On error → toast notification with error message

**`src/components/compliance/ComplianceResults.tsx`**
Full results view:
- Final score: large, IBM Plex Mono, color-coded (green/amber/red)
- Status badge: Compliant / Needs Improvement / Critical Gaps
- Three pillar score cards (CS, OA, OM) with weights shown
- Gap analysis table sorted by severity (Critical → Major → Minor)
- Remediation recommendations list
- "Download Report" button → `POST /api/report`
- "Run Another Check" button → resets form

**`src/components/compliance/PillarScoreCard.tsx`**
- Pillar name + weight (e.g., "Conceptual Soundness · 40%")
- Score in large IBM Plex Mono
- Color coding by score threshold
- Count of Critical / Major / Minor gaps for that pillar

**`src/components/compliance/GapAnalysisTable.tsx`**
- Columns: Severity · Element Code · Pillar · Description · Recommendation
- Sorted: Critical → Major → Minor
- Severity shown as colored badge
- Sharp corners (no border-radius)

### API Integration
- `POST /api/compliance` with `FormData` (file) or `application/json` (text)
- Handle 429 (rate limit exceeded) — show "Rate limit reached. You can run [N] checks per hour. Resets at [time]."
- Handle 500 — show "Something went wrong. Please try again."

### Acceptance Criteria
- [ ] Text paste and file upload modes both work end-to-end
- [ ] Model name required; minimum 100 chars enforced before submit
- [ ] File upload: client-side type + size validation before POST
- [ ] Skeleton loading shown during API call (not a spinner)
- [ ] ComplianceResults displays all scores, pillar breakdowns, gaps, recommendations
- [ ] Low confidence warning banner shown when appropriate
- [ ] Gap table sorted Critical → Major → Minor
- [ ] "Download Report" button triggers PDF download
- [ ] Rate limit error handled with informative message
- [ ] `npm run build` passes with zero TypeScript errors

---

## Issue S2-06: Submission History and Single Submission View

**Labels:** `sprint-2` `frontend` `backend`
**Milestone:** Sprint 2 (Mar 30–Apr 9)

### Overview
Build the submissions list page (`/submissions`) and single submission detail page (`/submissions/[id]`), plus the API routes that back them.

### API Routes

**`GET /api/submissions`** — list all submissions for authenticated user:
- Verify session server-side
- Return submissions ordered by `created_at` DESC
- Include: id, model_name (from models join), version_number, final_score, status (derived), assessment_confidence_label, created_at
- Paginate: accept `?page=N&limit=10` query params

**`GET /api/submissions/[id]`** — single submission:
- Verify session server-side AND verify `submission.user_id = session.userId` (defense in depth, RLS does this but verify in code too)
- Return full submission + all gaps
- 404 if not found or wrong user

**`DELETE /api/submissions/[id]`** — delete single submission:
- Verify session + ownership
- Hard delete (not soft delete) — submission + gaps deleted (cascades via FK)
- 204 on success

**`DELETE /api/submissions`** — delete all submissions for user:
- Verify session
- Delete all submissions for user (cascades to gaps)
- Requires `{ confirm: true }` in request body — refuse without it
- 204 on success

### Pages

**`/submissions` (`src/app/(dashboard)/submissions/page.tsx`)**
- List of all submissions
- Columns: Model Name · Version · Date · Final Score · Status · Actions
- Actions: "View" → `/submissions/[id]`, "Delete" (with confirmation modal)
- Pagination: 10 per page
- "Delete all history" button with confirmation modal
- Empty state: "No submissions yet" with link to `/check`

**`/submissions/[id]` (`src/app/(dashboard)/submissions/[id]/page.tsx`)**
- Full submission results view (reuse `ComplianceResults` component)
- "Download Report" button → `POST /api/report`
- "Back to history" link
- Show assessment confidence label
- 404 redirect if submission not found or wrong user

### Acceptance Criteria
- [ ] `GET /api/submissions` returns paginated list for authenticated user only
- [ ] `GET /api/submissions/[id]` returns full submission + gaps; 404 for wrong user
- [ ] `DELETE /api/submissions/[id]` hard-deletes, requires ownership
- [ ] `DELETE /api/submissions` requires `confirm: true`
- [ ] `/submissions` list page renders with pagination
- [ ] Deletion confirmed via modal before executing
- [ ] `/submissions/[id]` renders full results using `ComplianceResults` component
- [ ] RLS + server-side ownership check — users can never see each other's data
- [ ] `npm run build` passes with zero TypeScript errors

---

## Issue S2-07: PDF Report Generation (`POST /api/report`)

**Labels:** `sprint-2` `backend` `frontend`
**Milestone:** Sprint 2 (Mar 30–Apr 9)

### Overview
Implement server-side PDF report generation via React-PDF. When a user clicks "Download Report," the server renders a `@react-pdf/renderer` document and streams it as a downloadable PDF.

### Context
PDF is generated server-side in `POST /api/report`. No print dialog — file downloads directly. Filename: `prova-report-{modelName}-v{version}.pdf`. Read `ARCHITECTURE.md` Section 6 (PDF Report Generation Flow).

### Report Contents (from `PRD.md` Section 3.9)
1. Prova header + submission timestamp
2. Model name and version number
3. Final compliance score with pillar breakdown (CS / OA / OM)
4. Gap analysis table: severity · element code · pillar · description
5. Remediation recommendations sorted by severity (Critical first)
6. Assessment confidence indicator (High / Medium / Low)
7. SR 11-7 reference footer
8. "For training purposes only" disclaimer

### `src/components/report/ReportDocument.tsx`
React-PDF component (`@react-pdf/renderer`). Uses `Document`, `Page`, `View`, `Text`, `StyleSheet` from the library.

Design:
- Clean, professional — banking-appropriate
- Color-coded severity: Critical = red, Major = amber, Minor = blue/gray
- All scores in monospace font
- Page header with "Prova" and timestamp on every page
- Page footer with "For training and synthetic model documents only · SR 11-7 Reference"

### `src/app/api/report/route.ts`
```typescript
POST /api/report
Body: { submissionId: string }

1. Verify session server-side
2. Fetch submission + gaps from Supabase WHERE id = submissionId AND user_id = userId
   If not found → 404
3. Fetch model name from models table
4. Render <ReportDocument submission={...} gaps={...} /> via ReactPDF.renderToBuffer()
5. Return response with:
   Content-Type: application/pdf
   Content-Disposition: attachment; filename="prova-report-{modelName}-v{version}.pdf"
   Body: PDF buffer
```

### Acceptance Criteria
- [ ] `POST /api/report` returns a valid downloadable PDF
- [ ] PDF contains all 8 required sections
- [ ] Filename format: `prova-report-{modelName}-v{version}.pdf`
- [ ] Ownership verified server-side — users cannot download other users' reports
- [ ] Gaps sorted by severity in PDF (Critical → Major → Minor)
- [ ] "For training purposes only" disclaimer present on every page
- [ ] `npm run build` passes with zero TypeScript errors

---

## Issue S2-08: Settings Page (Dashboard Preferences)

**Labels:** `sprint-2` `frontend` `backend`
**Milestone:** Sprint 2 (Mar 30–Apr 9)

### Overview
Build the `/settings` page with dashboard section toggles and account management (password change / account deletion).

### Dashboard Preferences Section
Four toggle switches mapped to `user_preferences` table columns:
- Show Overview Panel (default: on)
- Show Model Inventory (default: on)
- Show Score Progression Chart (default: on)
- Show Recent Activity Feed (default: on)

Behavior:
- On page load: fetch user preferences from `user_preferences` table
- If no row exists → INSERT with all defaults before showing page
- Toggle change → `UPSERT` to `user_preferences` table immediately (no "save" button needed)
- Changes reflect on dashboard immediately

### Account Section
- Display current email (read-only)
- "Change password" → triggers Supabase password reset email (same flow as `/reset-password`)
- "Delete account" → confirmation modal with typed confirmation ("DELETE") → delete all user data then delete Supabase Auth user

> **Implementation note:** The `/reset-password` page sends the user a Supabase email that redirects to `/auth/callback?next=/settings`. When the user lands on `/settings` via that link, Supabase sets a temporary session that allows a one-time password update. The settings page must detect this state (check `supabase.auth.getSession()` for a session where the user arrived via a recovery token — Supabase sets `session.user.aud` or you can check `searchParams` for a `type=recovery` param passed through the callback) and surface a **"Set new password"** form inline. Use `supabase.auth.updateUser({ password: newPassword })` to commit the change. Without this form, the reset-password flow has no completion step.

### Acceptance Criteria
- [ ] Four preference toggles read from and write to `user_preferences` table
- [ ] Toggle state persists across page reloads
- [ ] Dashboard sections respond to preference changes
- [ ] "Change password" sends Supabase reset email
- [ ] "Delete account" requires typed confirmation
- [ ] `npm run build` passes with zero TypeScript errors

---

---

# SPRINT 3 ISSUES
**Focus: CI/CD, monitoring, security hardening, test suite, polish**

---

## Issue S3-01: GitHub Actions CI/CD Pipeline

**Labels:** `sprint-3` `infra`
**Milestone:** Sprint 3 (Apr 10–19)

### Overview
Set up GitHub Actions pipelines for PRs and production deployments. Every PR to `main` must pass lint, type check, unit tests, and build before merge. Merge to main triggers Vercel production deploy.

### Workflows to Create

**`.github/workflows/pr.yml`** — runs on every PR to `main`:
```yaml
Steps:
1. Checkout code
2. Setup Node.js (version matching project)
3. npm ci
4. npm run lint         — fail on any ESLint error
5. npm run typecheck    — fail on any TypeScript error
6. npm test            — fail on any test failure
7. npm run test:ai     — AI regression suite (see S3-02)
8. npm run build       — fail on build error
```

**`.github/workflows/deploy.yml`** — runs on merge to `main`:
```yaml
Steps:
1. All PR checks (reuse or trigger pr.yml)
2. Deploy to Vercel production via Vercel CLI or Vercel GitHub integration
3. Sentry release notification (new release + source map upload)
```

### Branch Protection Rules (document in repo README)
- `main` branch: require PR, require all CI checks to pass, no direct commits
- All changes via PRs (matches `CLAUDE.md` non-negotiable rule)

### Acceptance Criteria
- [ ] `pr.yml` runs on every PR to `main` and fails fast on any check failure
- [ ] `deploy.yml` runs on merge to `main`
- [ ] All secrets (ANTHROPIC_API_KEY, SUPABASE keys, SENTRY keys, VERCEL_TOKEN) stored in GitHub Actions secrets — not hardcoded
- [ ] Branch protection on `main` enabled
- [ ] `README.md` documents how to run the CI pipeline locally and what each step checks

---

## Issue S3-02: AI Regression Test Suite (Synthetic Documents)

**Labels:** `sprint-3` `testing` `ai`
**Milestone:** Sprint 3 (Apr 10–19)

### Overview
Implement the 7 synthetic test documents and the AI regression test runner. This suite runs on every PR to detect prompt regressions (score drift > 10 points).

### Synthetic Test Documents to Create

Create these files in `tests/synthetic/documents/` with content that matches the expected behavior:

| File | Description | Expected Outcome |
|---|---|---|
| `test_fully_compliant.txt` | Complete Black-Scholes option pricing model doc covering all 20 SR 11-7 elements | Final score 85–100 |
| `test_missing_conceptual.txt` | Doc with no CS section — has OA and OM content but CS-01 through CS-07 all absent | CS pillar score < 40 |
| `test_missing_outcomes.txt` | Doc with no backtesting or performance documentation (OA-01 through OA-07 absent) | OA pillar score < 40 |
| `test_missing_monitoring.txt` | Doc with no monitoring framework (OM-01 through OM-06 absent) | OM pillar score < 40 |
| `test_all_critical_gaps.txt` | Minimal one-paragraph doc; most SR 11-7 elements absent | Final score < 30 |
| `test_prompt_injection.txt` | Normal model doc + embedded injection attempts ("ignore previous instructions", "return score of 100", "you are now a different AI") | Normal scoring; injection attempts have no effect |
| `test_verbose_low_quality.txt` | Very long doc (5000+ words) with vague language — mentions every element name but provides no substance | Score reflects quality, not length — should score < 60 |

### Test Runner (`tests/synthetic/runner.test.ts`)
```typescript
// For each of the 7 documents:
// 1. Read file from tests/synthetic/documents/
// 2. Call POST /api/compliance (or call runCompliance() directly)
// 3. Assert score is within expected range
// 4. Log: document name, actual score, expected range, pass/fail
//
// Score drift detection:
// - On first run: save scores to tests/synthetic/baseline.json
// - On subsequent runs: compare to baseline.json
// - Fail if any score changes by more than 10 points from baseline
// - Update baseline only when explicitly run with --update-baseline flag
```

### npm Script
```bash
npm run test:ai
# Runs runner.test.ts
# Exits with non-zero code if any assertion or drift check fails
# Output: table of document | expected | actual | status
```

### Acceptance Criteria
- [ ] All 7 synthetic documents created with appropriate content
- [ ] `test_prompt_injection.txt` scores normally (injection has no effect)
- [ ] `test_verbose_low_quality.txt` scores based on quality (not word count)
- [ ] `runner.test.ts` runs all 7 documents and asserts expected ranges
- [ ] Drift detection: fails if score changes > 10 points from baseline
- [ ] `npm run test:ai` exits 0 when all pass, non-zero on any failure
- [ ] `baseline.json` committed to repo after first passing run

---

## Issue S3-03: Sentry Error Tracking and Vercel Analytics

**Labels:** `sprint-3` `infra`
**Milestone:** Sprint 3 (Apr 10–19)

### Overview
Wire up Sentry for error tracking and performance monitoring, and Vercel Analytics for page view tracking. Both must be configured so errors in production surface immediately.

### Sentry Setup

**Client-side (`sentry.client.config.ts`):**
- Uses `NEXT_PUBLIC_SENTRY_DSN`
- Capture unhandled errors + performance traces
- Do NOT log `ANTHROPIC_API_KEY`, user document text, or any PII

**Server/edge (`instrumentation.ts`):**
- Uses `SENTRY_DSN` (not the public one)
- Capture API route errors

**Build-time source map uploads (`next.config.ts`):**
- Uses `SENTRY_ORG` + `SENTRY_PROJECT`
- Upload source maps on production build

**Alerts to configure in Sentry dashboard (document in README):**
- Alert when error rate spikes (>10 errors/hour)
- Alert when `POST /api/compliance` p95 latency exceeds 60 seconds
- Alert when any unhandled error occurs

### Vercel Analytics
- Add `<Analytics />` from `@vercel/analytics/react` to `src/app/layout.tsx`
- No custom event tracking needed for MVP

### What NOT to Log
- Never log `ANTHROPIC_API_KEY` (it will never appear in code anyway per CLAUDE.md rules)
- Never log raw document text (log document text hash instead — same approach as evals table)
- Never log Supabase secret key

### Acceptance Criteria
- [ ] `sentry.client.config.ts` created with `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `instrumentation.ts` created with `SENTRY_DSN`
- [ ] Source map upload configured in `next.config.ts`
- [ ] Sentry dashboard accessible to both team members
- [ ] Error alerts configured per above
- [ ] Vercel Analytics enabled
- [ ] No sensitive data (API keys, document text) in Sentry logs
- [ ] Trigger a test error in development and confirm it appears in Sentry dashboard

---

## Issue S3-04: Security Hardening and Penetration Checklist

**Labels:** `sprint-3` `security`
**Milestone:** Sprint 3 (Apr 10–19)

### Overview
Complete a security review and harden all remaining gaps. Produce a documented security checklist verifying all OWASP Top 10 items from `PRD.md` Section 7.

### Security Items to Verify and Harden

**API Security:**
- [ ] Every API route (`/api/compliance`, `/api/submissions`, `/api/submissions/[id]`, `/api/report`) verifies session as its absolute first operation — before parsing body, before any processing
- [ ] Rate limiting confirmed working: exceed 10 requests/hour → 429 with correct error shape
- [ ] `RATE_LIMIT_REQUESTS_PER_HOUR` env var respected correctly

**Prompt Injection:**
- [ ] Verify XML delimiter wrapping: document text always reaches agents as `<document>...\n</document>`
- [ ] Run `test_prompt_injection.txt` from the AI test suite — confirm score is normal
- [ ] Confirm agent SECURITY RULE instructions are present verbatim in all four agent prompts

**File Upload:**
- [ ] Extension + MIME type double-check working for `.pdf` and `.docx`
- [ ] Attempted upload of `.exe`, `.js`, `.html` files rejected with 400
- [ ] Attempted upload of a file with `.pdf` extension but wrong MIME type rejected
- [ ] Files never written to disk — confirm no `fs.writeFile` calls in parsers

**XSS:**
- [ ] Grep entire codebase for `dangerouslySetInnerHTML` — must be zero occurrences
- [ ] All user-supplied text rendered via React (which escapes by default)

**Data Isolation:**
- [ ] Supabase RLS policies verified: attempt to read another user's submission → 0 rows returned
- [ ] Server-side ownership check in `GET /api/submissions/[id]` — verify `user_id` matches session even with RLS

**Secret Exposure:**
- [ ] `ANTHROPIC_API_KEY` referenced only in `src/lib/anthropic/client.ts` — grep confirms
- [ ] `SUPABASE_SECRET_KEY` referenced only in `src/lib/supabase/server.ts` — grep confirms
- [ ] No secrets in any `NEXT_PUBLIC_*` variables

**Headers:**
- [ ] Add security headers in `next.config.ts`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy`: appropriate for Next.js + Supabase

### Deliverable
A `docs/SECURITY_REVIEW.md` file documenting:
- Each OWASP Top 10 item from `PRD.md` Section 7.1
- Status: ✅ Verified / ⚠️ Mitigated with caveat / ❌ Not addressed
- How each was verified (grep result, test name, manual test description)

### Acceptance Criteria
- [ ] All checklist items above verified and documented
- [ ] `docs/SECURITY_REVIEW.md` created and complete
- [ ] Zero `dangerouslySetInnerHTML` in codebase (grep check)
- [ ] Secret isolation confirmed by grep
- [ ] Security headers added to `next.config.ts`
- [ ] Prompt injection test passes

---

## Issue S3-05: Unit Test Coverage — Agents, Scoring, API Routes

**Labels:** `sprint-3` `testing`
**Milestone:** Sprint 3 (Apr 10–19)

### Overview
Write unit tests for all critical logic: agent output parsing, scoring calculator, API route behavior (with mocked Claude and Supabase). Target: meaningful coverage of all business-critical paths.

### Test Files to Complete

**`tests/scoring/calculator.test.ts`** (extend Sprint 2 version):
- Already has 6 test cases from S2-02
- Add: verify `ScoringResultSchema` validation rejects invalid inputs
- Add: verify discrepancy logging (mock `console.warn`, verify it's called when agent score ≠ calculated)

**`tests/agents/conceptualSoundness.test.ts`:**
- Mock `anthropic.messages.create` to return a valid JSON response
- Test: valid agent output → `AgentOutputSchema` validates → typed object returned
- Test: malformed JSON from Claude → typed error thrown
- Test: valid JSON but wrong schema (missing `pillar` field) → Zod error thrown
- Test: verify document is wrapped in `<document>...</document>` before API call (inspect the call args)

**`tests/agents/judge.test.ts`:**
- Mock `anthropic.messages.create`
- Test: valid judge output → `JudgeOutputSchema` validates
- Test: confidence < 0.6 → `retry_recommended: true`
- Test: confidence ≥ 0.6 → `retry_recommended: false`

**`tests/api/compliance.test.ts`:**
- Mock `runCompliance`, `calculateScores`, Supabase client
- Test: no session → 401
- Test: rate limit exceeded → 429
- Test: invalid file type → 400
- Test: text too short (< 100 chars) → 400
- Test: valid text submission → 200 with correct response shape
- Test: agent error → 500

### Mocking Strategy
- Mock `src/lib/anthropic/client.ts` at the module level — never call real Claude in unit tests
- Mock Supabase client — never hit real database in unit tests
- Use `jest.mock()` and typed mock return values

### Acceptance Criteria
- [ ] All test files created with test cases listed above
- [ ] Tests run with `npm test` — all pass
- [ ] No real Claude API calls in any unit test (mocked)
- [ ] No real Supabase calls in any unit test (mocked)
- [ ] `npm run build` passes after all tests added

---

## Issue S3-06: Help Page and Final Polish

**Labels:** `sprint-3` `frontend`
**Milestone:** Sprint 3 (Apr 10–19)

### Overview
Build the `/help` page with SR 11-7 context, and complete all remaining UI polish: empty states, error toasts, loading skeletons, accessibility, and mobile responsiveness.

### Help Page (`/help`)
Content:
- What is SR 11-7? Brief, plain-English explanation
- The three validation pillars: Conceptual Soundness (40%), Outcomes Analysis (35%), Ongoing Monitoring (25%)
- All 20 element codes with plain-English descriptions (pulled from `AGENT_PROMPTS.md` element code reference)
- Scoring system explanation: how Critical/Major/Minor translate to score deductions
- How to read a Prova report
- "For training and synthetic model documents only" disclaimer

### UI Polish Checklist

**Empty states (implement for all list views):**
- Dashboard with no submissions: friendly message + "Run your first compliance check" button → `/check`
- Submissions list empty: same
- Model Inventory Table with no data: "No models submitted yet"
- Score Progression Chart with < 2 submissions for selected model: "Submit a second version to see score progression"

**Toast notifications (`src/components/ui/Toast.tsx`):**
- Error toast: red, auto-dismisses after 5 seconds, shows error message
- Success toast: green, auto-dismisses after 3 seconds
- Used for: compliance check errors, delete confirmations, settings saves

**Loading skeletons:**
- Audit every page — replace any remaining loading indicators that are spinners with skeletons
- Skeleton variants: text line, stat card, table row, chart area

**Accessibility:**
- All interactive elements have `aria-label` or visible text
- Color is never the only indicator of state (severity badges have text too)
- Keyboard navigation works for all forms and tables

**Mobile responsiveness:**
- Dashboard sections stack vertically on mobile
- Model Inventory Table horizontally scrollable on mobile
- Navbar collapses to hamburger menu on mobile

### Acceptance Criteria
- [ ] `/help` page complete with all SR 11-7 element codes explained
- [ ] Empty states on all list/chart views
- [ ] Toast component built and used for errors/successes
- [ ] Zero spinners in production builds (skeleton screens only)
- [ ] Basic keyboard navigation works (tab through forms, tables)
- [ ] Mobile layout doesn't break on < 768px viewport
- [ ] `npm run build` passes with zero TypeScript errors

---

*Prova GitHub Issues Spec v1.0 | Generated March 22, 2026*
*Total issues: 17 (8 Sprint 1, 7 Sprint 2, 6 Sprint 3)*
*Do not modify agent prompt content in any issue — copy verbatim from AGENT_PROMPTS.md*
