# Prova — GitHub Issues Spec
**For use with GitHub Projects. All three sprints. Mid-level granularity.**
**Each issue is self-contained — safe to drop directly into Claude for implementation.**

---

## Issue Index

| ID | Title | Sprint | Status |
|----|-------|--------|--------|
| S1-01 | Project Setup — Next.js, TypeScript, Supabase, Tailwind, Fonts | 1 | ✅ Done |
| S1-02 | Supabase Schema, RLS Policies, and Client Setup | 1 | ✅ Done |
| S1-03 | Authentication — Email/Password, Google OAuth, Middleware Guard | 1 | ✅ Done |
| S1-04 | Zod Schemas — All Validation Types | 1 | ✅ Done |
| S1-05 | Input Sanitization and File Parsing | 1 | ✅ Done |
| S1-06 | Anthropic Client and Single Agent (Conceptual Soundness) | 1 | ✅ Done |
| S1-07 | POST /api/compliance — Sprint 1 Version (Single Agent) | 1 | ✅ Done |
| S1-08 | Landing Page and Base Layout | 1 | ✅ Done |
| S2-01 | Complete Parallel Agent System (Agents 2, 3, Orchestrator, Judge) | 2 | ✅ Done |
| S2-02 | Scoring Calculator | 2 | ✅ Done |
| S2-03 | Update POST /api/compliance — Full 3-Agent + Judge + Scoring Flow | 2 | ✅ Done |
| S2-04 | Dashboard Page — Overview, Model Inventory, Score Chart, Activity Feed | 2 | ✅ Done |
| S2-05 | New Compliance Check Page (`/check`) | 2 | ✅ Done |
| S2-06 | Submission History and Single Submission View | 2 | ✅ Done |
| S2-07 | PDF Report Generation (`POST /api/report`) | 2 | ✅ Done |
| S2-08 | Settings Page (Dashboard Preferences) | 2 | ✅ Done |
| S3-01 | GitHub Actions CI/CD Pipeline | 3 | ✅ Done |
| S3-02 | AI Regression Test Suite (Synthetic Documents) | 3 | 🔲 Pending |
| S3-03 | Sentry Error Tracking and Vercel Analytics | 3 | 🔲 Pending |
| S3-04 | Security Hardening and Penetration Checklist | 3 | 🔲 Pending |
| S3-05 | Unit Test Coverage — Agents, Scoring, API Routes | 3 | 🔲 Pending |
| S3-06 | Help Page and Final Polish | 3 | ✅ Done |

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

# SPRINT 1 ISSUES ✅ ALL DONE
**Focus: Auth, document input, single agent end-to-end**

---

## Issue S1-01 ✅ DONE: Project Setup — Next.js, TypeScript, Supabase, Tailwind, Fonts
**Labels:** `sprint-1` `backend` `frontend` | **Milestone:** Sprint 1 (Mar 19–29)
**Implemented:** Next.js 16 App Router with TypeScript strict mode, all dependencies installed, three self-hosted fonts (Playfair Display, IBM Plex Mono, Geist), CSS variables in `globals.css`, `.env.local.example`, npm scripts, `GET /api/health` endpoint.
**See:** `src/app/layout.tsx` · `src/app/globals.css` · `tailwind.config.ts` · `package.json` · `src/app/api/health/route.ts`

---

## Issue S1-02 ✅ DONE: Supabase Schema, RLS Policies, and Client Setup
**Labels:** `sprint-1` `database` `security` `backend` | **Milestone:** Sprint 1 (Mar 19–29)
**Implemented:** All 5 tables (models, submissions, gaps, user_preferences, evals), RLS policies, indexes, browser client, server client with `createServiceClient()`, middleware session helper.
**See:** `src/lib/supabase/` · `docs/DATABASE.md` (authoritative SQL)

---

## Issue S1-03 ✅ DONE: Authentication — Email/Password, Google OAuth, Middleware Guard
**Labels:** `sprint-1` `backend` `frontend` `security` | **Milestone:** Sprint 1 (Mar 19–29)
**Implemented:** `/login`, `/signup`, `/reset-password` pages; Next.js middleware in `src/proxy.ts` redirecting unauthenticated users; Supabase session refresh on every request.
**See:** `src/app/(auth)/` · `src/proxy.ts` · `src/lib/supabase/middleware.ts`

---

## Issue S1-04 ✅ DONE: Zod Schemas — All Validation Types
**Labels:** `sprint-1` `backend` `ai` | **Milestone:** Sprint 1 (Mar 19–29)
**Implemented:** All schemas in `src/lib/validation/schemas.ts` — GapSchema, AgentOutputSchema, JudgeOutputSchema, ComplianceRequestSchema, ComplianceResponseSchema, ScoringResultSchema, UserPreferencesSchema and all associated TypeScript types.
**See:** `src/lib/validation/schemas.ts` · `docs/SCHEMAS.md` (authoritative definitions)

---

## Issue S1-05 ✅ DONE: Input Sanitization and File Parsing
**Labels:** `sprint-1` `backend` `security` | **Milestone:** Sprint 1 (Mar 19–29)
**Implemented:** `sanitizeText()` (strips HTML/scripts), `validateFileType()` (extension + MIME double check), `parsePDF()`, `parseDOCX()`, `checkRateLimit()` (in-memory, per user per hour).
**See:** `src/lib/security/sanitize.ts` · `src/lib/security/rateLimit.ts` · `src/lib/parsers/pdf.ts` · `src/lib/parsers/docx.ts`

---

## Issue S1-06 ✅ DONE: Anthropic Client and Single Agent (Conceptual Soundness) — End-to-End
**Labels:** `sprint-1` `ai` `backend` | **Milestone:** Sprint 1 (Mar 19–29)
**Implemented:** Anthropic SDK client (sole reference to `ANTHROPIC_API_KEY`), CS agent with verbatim prompt from `AGENT_PROMPTS.md`, Sprint 1 stub orchestrator (single agent only).
**See:** `src/lib/anthropic/client.ts` · `src/lib/agents/conceptualSoundness.ts` · `src/lib/agents/orchestrator.ts`

---

## Issue S1-07 ✅ DONE: POST /api/compliance — Sprint 1 Version (Single Agent)
**Labels:** `sprint-1` `backend` `security` | **Milestone:** Sprint 1 (Mar 19–29)
**Implemented:** Compliance route with session verification → rate limit → parse/validate → sanitize → CS agent → Supabase write. Upgraded to full 3-agent flow in S2-03.
**See:** `src/app/api/compliance/route.ts`

---

## Issue S1-08 ✅ DONE: Landing Page and Base Layout
**Labels:** `sprint-1` `frontend` | **Milestone:** Sprint 1 (Mar 19–29)
**Implemented:** Landing page at `/` with hero, 3-pillar section, CTAs; authenticated layout with navbar; Navbar with all links + sign out.
**See:** `src/app/page.tsx` · `src/app/(dashboard)/layout.tsx` · `src/components/layout/Navbar.tsx`

---

---

# SPRINT 2 ISSUES
**Focus: All three agents, judge, scoring, dashboard, PDF reports**

---

## Issue S2-01 ✅ DONE: Complete Parallel Agent System (Agents 2, 3, Orchestrator, Judge)
**Labels:** `sprint-2` `ai` `backend` | **Milestone:** Sprint 2 (Mar 30–Apr 9)
**Implemented:** OA and OM agents with verbatim prompts, Judge agent, full orchestrator with `Promise.all` + retry loop (max 2 retries on judge confidence < 0.6).
**See:** `src/lib/agents/outcomesAnalysis.ts` · `src/lib/agents/ongoingMonitoring.ts` · `src/lib/agents/judge.ts` · `src/lib/agents/orchestrator.ts`

---

## Issue S2-02 ✅ DONE: Scoring Calculator
**Labels:** `sprint-2` `ai` `backend` | **Milestone:** Sprint 2 (Mar 30–Apr 9)
**Implemented:** `calculateScores()` recalculates pillar scores from gaps (never trusts agent math), weighted final score (CS×0.40 + OA×0.35 + OM×0.25), status thresholds, discrepancy logging.
**See:** `src/lib/scoring/calculator.ts` · `tests/scoring/calculator.test.ts`

---

## Issue S2-03 ✅ DONE: Update POST /api/compliance — Full 3-Agent + Judge + Scoring Flow
**Labels:** `sprint-2` `backend` `ai` | **Milestone:** Sprint 2 (Mar 30–Apr 9)
**Implemented:** Compliance route upgraded to full orchestrator + scoring calculator, all three pillar scores stored, all gaps from all agents stored with correct pillar labels, eval record written after every check, `assessment_confidence_label` returned.
**See:** `src/app/api/compliance/route.ts`

---

## Issue S2-04 ✅ DONE: Dashboard Page — Overview, Model Inventory, Score Chart, Activity Feed

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

### Design Requirements
- Follow `PRD.md` Section 8 design system exactly
- Background: `var(--color-bg-primary)` (#0A0F1E)
- Cards/panels: `var(--color-bg-secondary)` (#111827)
- All scores/numbers: IBM Plex Mono
- Loading states: skeleton screens only (never spinners)
- No `dangerouslySetInnerHTML` anywhere

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

## Issue S2-05 ✅ DONE: New Compliance Check Page (`/check`)

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

### Design Requirements
- Follow `PRD.md` Section 8 design system exactly
- Loading states: skeleton screens only (never spinners)
- No `dangerouslySetInnerHTML` anywhere
- All scores in IBM Plex Mono

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

## Issue S2-06 ✅ DONE: Submission History and Single Submission View

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

## Issue S2-07 ✅ DONE: PDF Report Generation (`POST /api/report`)

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

## Issue S2-08 ✅ DONE: Settings Page (Dashboard Preferences)

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

## Issue S3-01 ✅ DONE: GitHub Actions CI/CD Pipeline

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

## Issue S3-02 🔲 PENDING: AI Regression Test Suite (Synthetic Documents)

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

## Issue S3-03 🔲 PENDING: Sentry Error Tracking and Vercel Analytics

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

## Issue S3-04 🔲 PENDING: Security Hardening and Penetration Checklist

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

## Issue S3-05 🔲 PENDING: Unit Test Coverage — Agents, Scoring, API Routes

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

## Issue S3-06 ✅ DONE: Help Page and Final Polish

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

*Prova GitHub Issues Spec v1.1 | Updated March 31, 2026*
*Total issues: 22 (8 Sprint 1, 8 Sprint 2, 6 Sprint 3)*
*Completed: S1-01 through S1-08, S2-01, S2-02, S2-03 (11 of 22)*
*Do not modify agent prompt content in any issue — copy verbatim from AGENT_PROMPTS.md*
