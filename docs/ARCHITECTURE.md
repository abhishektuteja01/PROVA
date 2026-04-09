# Prova — System Architecture
**Version:** 1.0 | **Date:** March 19, 2026

---

## 1. System Overview

Prova is a well-architected Next.js 16 monolith deployed on Vercel. The frontend and backend coexist in a single repository. All AI logic runs server-side via Next.js API routes — the Anthropic API key is never exposed to the client.

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│                                                      │
│  React Components → Fetch API → Next.js API Routes  │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTES (Vercel)             │
│                                                      │
│  /api/compliance  /api/submissions  /api/report      │
│  /api/health                                         │
└─────────────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
┌──────────────────┐  ┌──────────────────────────────┐
│  ANTHROPIC API   │  │         SUPABASE              │
│                  │  │                               │
│  Claude Haiku    │  │  PostgreSQL + Auth + RLS      │
│  3.5             │  │                               │
└──────────────────┘  └──────────────────────────────┘
```

---

## 2. Data Flow — Compliance Check

This is the core operation of Prova. Every other feature is secondary to this flow.

```
User submits document
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  POST /api/compliance                                  │
│                                                        │
│  1. Verify Supabase session (server-side)              │
│  2. Check rate limit (user ID + timestamp)             │
│  3. Validate request body (Zod: ComplianceRequest)     │
│  4. Parse file if uploaded:                            │
│     - PDF  → unpdf     → extracted text               │
│     - DOCX → mammoth   → extracted text               │
│     - File deleted from memory immediately             │
│  5. Sanitize text (strip HTML, scripts)                │
│  6. Wrap in XML delimiters                             │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  PARALLEL AGENT EXECUTION (Promise.all)                │
│                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────┐ │
│  │ Conceptual      │  │ Outcomes        │  │Ongoing │ │
│  │ Soundness Agent │  │ Analysis Agent  │  │Monitor │ │
│  │                 │  │                 │  │Agent   │ │
│  │ Evaluates       │  │ Evaluates       │  │        │ │
│  │ CS-01→CS-07     │  │ OA-01→OA-07    │  │OM-01→  │ │
│  │                 │  │                 │  │OM-06   │ │
│  │ Returns:        │  │ Returns:        │  │        │ │
│  │ AgentOutput     │  │ AgentOutput     │  │Returns:│ │
│  └─────────────────┘  └─────────────────┘  │AgentOu │ │
│                                             └────────┘ │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  ZOD SCHEMA VALIDATION                                 │
│                                                        │
│  Validate all three AgentOutput objects                │
│  If invalid → retry (counts toward max 2)             │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  JUDGE AGENT                                           │
│                                                        │
│  Input: three validated AgentOutput objects            │
│  Checks: consistency, completeness, anomalies          │
│  Returns: JudgeOutput with confidence score            │
│                                                        │
│  If confidence < 0.6 AND retries < 2:                 │
│    → Loop back to PARALLEL AGENT EXECUTION             │
│    → Pass original doc + previous outputs as context   │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  SCORING CALCULATOR                                    │
│                                                        │
│  csScore  = 100 - (critGaps×20) - (majGaps×10) - ...  │
│  oaScore  = 100 - deductions                           │
│  omScore  = 100 - deductions                           │
│  final    = (cs×0.40) + (oa×0.35) + (om×0.25)        │
│  status   = Compliant | Needs Improvement | Critical   │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  SUPABASE WRITE                                        │
│                                                        │
│  Upsert to models (get or create model + version)      │
│  Insert to submissions                                 │
│  Insert to gaps (one row per gap)                      │
└───────────────────────────────────────────────────────┘
        │
        ▼
Return ComplianceResponse to client
```

---

## 3. Authentication Flow

```
User visits /dashboard
        │
        ▼
Next.js proxy.ts
        │
        ├── Has valid Supabase session? ──YES──► Render page
        │
        └── NO ──► Redirect to /login
                         │
                         ▼
                   Login with email/password
                   or Google OAuth
                         │
                         ▼
                   Supabase Auth issues JWT
                         │
                         ▼
                   Redirect to /dashboard
```

---

## 4. Database Relationships

```
users (Supabase Auth)
  │
  ├── models
  │     id
  │     user_id ──────────────── FK → users.id
  │     model_name
  │     created_at
  │         │
  │         └── submissions
  │               id
  │               model_id ───── FK → models.id
  │               user_id ─────── FK → users.id
  │               version_number
  │               document_text
  │               conceptual_score
  │               outcomes_score
  │               monitoring_score
  │               final_score
  │               gap_analysis    JSONB
  │               judge_confidence
  │               assessment_confidence_label
  │               created_at
  │                   │
  │                   └── gaps
  │                         id
  │                         submission_id ─── FK → submissions.id
  │                         user_id ────────── FK → users.id
  │                         pillar
  │                         element_code
  │                         element_name
  │                         severity
  │                         description
  │                         recommendation
  │                         created_at
  │
  └── user_preferences
        id
        user_id ────────────── FK → users.id
        show_overview_panel
        show_model_inventory
        show_score_progression
        show_recent_activity
        updated_at
```

---

## 5. Agent Architecture Detail

```
orchestrator.ts
      │
      ├── ATTEMPT (max 3 total: 1 initial + 2 retries)
      │
      │   Promise.all([
      │     conceptualSoundness(document, context?)
      │     outcomesAnalysis(document, context?)
      │     ongoingMonitoring(document, context?)
      │   ])
      │         │
      │         ▼
      │   validateOutputs(Zod schemas)
      │         │
      │         ▼
      │   judge(document, agentOutputs)
      │         │
      │         ├── confidence >= 0.6 ──► ACCEPT → proceed to scoring
      │         │
      │         └── confidence < 0.6
      │               │
      │               ├── retries < 2 ──► INCREMENT retry → loop back
      │               │
      │               └── retries >= 2 ──► ACCEPT with Low confidence warning
      │
      └── Return: { outputs, judgeOutput, retryCount }
```

---

## 6. PDF Report Generation Flow

```
User clicks "Download Report" on /submissions/[id]
        │
        ▼
POST /api/report  { submissionId }
        │
        ▼
Fetch submission + gaps from Supabase (verify user_id match)
        │
        ▼
React-PDF: render <ReportDocument submission={...} gaps={...} />
        │
        ▼
Stream PDF buffer as response
Content-Disposition: attachment; filename="prova-report-{modelName}-v{version}.pdf"
        │
        ▼
Browser downloads PDF directly
```

---

## 7. Security Architecture

```
CLIENT
  │
  │  HTTPS only (enforced by Vercel)
  │
  ▼
NEXT.JS PROXY (proxy.ts)
  │  - Supabase session verification
  │  - Redirect unauthenticated requests
  │
  ▼
API ROUTES
  │  - Server-side session re-verification (defense in depth)
  │  - Rate limiting check (rateLimit.ts)
  │  - Input validation (Zod schemas)
  │  - File type validation (sanitize.ts)
  │  - Text sanitization (sanitize.ts)
  │  - XML delimiter wrapping (before Claude)
  │
  ▼
ANTHROPIC API
  │  - API key in environment variable only
  │  - Never referenced in client-side code
  │  - Never logged
  │
  ▼
SUPABASE
  - RLS policies enforce user_id isolation at database level
  - Service role key used server-side only
  - Anon key safe for client (RLS protects data)
```

---

## 8. Eval System Architecture

Every compliance check writes an eval record for historical metrics tracking:

```
compliance check completes
        │
        ▼
Write to Supabase: evals table
  - submission_id
  - input_text_hash (SHA-256, not raw text)
  - agent_outputs (JSONB)
  - judge_output (JSONB)
  - retry_count
  - total_latency_ms
  - model_used (haiku-3-5)
  - timestamp
        │
        ▼
Aggregated metrics available via /api/evals (admin only, future)
  - Average scores over time
  - Agent agreement rates
  - Retry rates
  - p50/p95 latency
```

---

*Prova Architecture v1.0 | March 2026*
