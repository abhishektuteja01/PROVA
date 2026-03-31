# Prova — Product Requirements Document
**Version:** 2.0  
**Date:** March 19, 2026  
**Status:** Approved  
**Team:** Abhishek Tuteja + Teammate

---

## Table of Contents
1. Product Overview
2. User Stories
3. Core Features
4. AI Security & Bias Mitigation
5. AI-TDD
6. Technical Architecture
7. Security
8. UI/UX Design
9. CI/CD & DevOps
10. Team Process
11. Deliverables Checklist
12. Out of Scope
13. Future Roadmap
14. Technical Specifications
15. File Structure

---

## 1. Product Overview

### 1.1 Product Name
**Prova** — *Proof of compliance.*

### 1.2 Tagline
*Know what's missing before regulators do.*

### 1.3 Description
Prova is a production-grade web application that automates SR 11-7 model risk management compliance assessment. Users upload or paste model documentation, and Prova uses three parallel AI agents to evaluate it against Federal Reserve SR 11-7 requirements — identifying compliance gaps, scoring documentation completeness across all three validation pillars, and generating downloadable remediation reports.

Prova is explicitly designed for training and synthetic model documents. Its architecture is built for future self-hosted deployment within bank infrastructure, where the Anthropic API key is swapped for an internally managed configuration variable.

Think of it as a grammar checker — but for banking regulation documents.

### 1.4 Problem Statement
Junior model validators at regional banks spend 3-4 hours manually checking model documentation against SR 11-7 requirements using paper checklists. The process is inconsistent, error-prone, and difficult to audit. Model developers receive rejection feedback late in the validation cycle, creating expensive rework loops. Model Risk Managers have no portfolio-level visibility into compliance status across their model inventory.

### 1.5 Solution
Prova automates the SR 11-7 compliance checklist using parallel AI agents, reduces manual review time from hours to minutes, provides consistent and auditable scoring, and gives Model Risk Managers a real-time portfolio dashboard.

### 1.6 Target Users

**Alex — Junior Model Validator**
Entry-level analyst at a regional bank. Manually checks model docs against SR 11-7 checklist. Spends 3-4 hours per document review. Needs guidance on what's missing and why it matters.

**Sarah — Model Risk Manager**
Senior MRM officer overseeing 20+ models annually. Needs portfolio-level visibility — which models are compliant, which need remediation, audit trail for regulators.

**Raj — Model Developer**
Quant who builds pricing models and submits documentation for validation. Needs fast pre-submission feedback before formal review to avoid rejection cycles.

### 1.7 Positioning
- **MVP scope:** Training and synthetic documents only
- **Future scope:** Self-hosted deployment within bank infrastructure (API key becomes environment variable managed by bank IT)
- **Not in scope:** Real confidential bank documentation in current deployment

---

## 2. User Stories

**Alex (Junior Validator):**
*"As a junior validator, I want to upload a model document and get a structured gap analysis so that I can complete my SR 11-7 checklist in minutes instead of hours."*

**Sarah (Model Risk Manager):**
*"As a model risk manager, I want a dashboard showing compliance scores across all submitted models so that I can prioritize reviews and demonstrate regulatory readiness."*

**Raj (Model Developer):**
*"As a model developer, I want pre-submission feedback on my documentation so that I can fix gaps before formal validation and avoid rejection cycles."*

---

## 3. Core Features

### 3.1 Authentication
- Email/password and Google OAuth via Supabase Auth
- JWT-based session management (Supabase defaults)
- Password reset flow included in MVP
- Row Level Security (RLS) enforced on all database tables — users access only their own data
- See `/docs/DATABASE.md` for exact RLS SQL policies

### 3.2 Document Input
Two input methods supported:

**Text Input:**
- Free text area with character count
- Paste model documentation directly
- Minimum 100 characters required before submission

**File Upload:**
- Accepted formats: PDF, DOCX only
- Maximum file size: 10MB
- File type validated server-side (extension + MIME type double check)
- Text extracted server-side immediately after upload
- Original file deleted from memory immediately after text extraction
- Only extracted text persisted to database — no file storage

### 3.3 Parallel Agent Architecture
See `/docs/AGENT_PROMPTS.md` for exact prompt templates.
See `/docs/SCHEMAS.md` for exact JSON output schemas.

Three agents run in parallel via `Promise.all`, each owning one SR 11-7 validation pillar:

**Agent 1 — Conceptual Soundness Agent**
Evaluates theoretical foundation and assumptions documentation across 7 SR 11-7 elements (CS-01 through CS-07).
Weight in final score: **40%**

**Agent 2 — Outcomes Analysis Agent**
Evaluates backtesting and performance documentation across 7 SR 11-7 elements (OA-01 through OA-07).
Weight in final score: **35%**

**Agent 3 — Ongoing Monitoring Agent**
Evaluates monitoring framework documentation across 6 SR 11-7 elements (OM-01 through OM-06).
Weight in final score: **25%**

SR 11-7 element codes are defined in `/docs/AGENT_PROMPTS.md`.

### 3.4 LLM-as-Judge Agent
See `/docs/AGENT_PROMPTS.md` for exact judge prompt template.

After three parallel agents complete, Judge Agent reviews their outputs:

**Judge responsibilities:**
- Consistency check: do the three agents contradict each other?
- Completeness check: did each agent assess all required elements in its pillar?
- Anomaly detection: flag suspicious scoring patterns (potential prompt injection indicator)
- Confidence scoring: assign uncertainty score (0.0–1.0) to overall assessment

**Retry loop:**
- If judge confidence < 0.6: all three agents reiterate with original document + previous agent outputs as additional context
- Judge receives fresh agent outputs each retry
- Maximum 2 retries before system accepts output regardless
- After max retries with confidence still < 0.6: surface "Low Confidence" warning to user

**Judge output does not affect final compliance score** — it is a separate quality indicator:
- 0.8–1.0: "High" confidence
- 0.6–0.79: "Medium" confidence
- 0.0–0.59: "Low" confidence (triggers retry or warning)

### 3.5 Scoring System
See `/docs/SCHEMAS.md` for scoring calculator types.

**Per-pillar scoring:**
- Each pillar starts at 100
- Deductions applied per gap identified:
  - Critical gap: -20 points
  - Major gap: -10 points
  - Minor gap: -5 points
- Pillar score floor: 0 (cannot go negative)

**Final compliance score:**
- Weighted average: (CS × 0.40) + (OA × 0.35) + (OM × 0.25)
- Displayed as 0–100 with color coding:
  - 80–100: Green — Compliant
  - 60–79: Amber — Needs Improvement
  - 0–59: Red — Critical Gaps

**Gap severity definitions:**
- **Critical:** Required SR 11-7 element completely absent
- **Major:** Element present but substantially incomplete
- **Minor:** Element present, minor documentation gaps

### 3.6 Remediation Recommendations
- Category-level recommendations per identified gap
- Mapped to SR 11-7 pillar and element code
- Prioritized by severity (Critical first)
- Example: "CS-03 — Add explicit documentation of all key model assumptions"

### 3.7 Dashboard
All users see same base dashboard. Users can hide/show sections in Settings > Dashboard Preferences.

**Hideable sections (4 toggles):**
1. Overview Panel
2. Model Inventory Table
3. Score Progression Chart
4. Recent Activity Feed

**Overview Panel:**
- Total models submitted
- Average compliance score across all submissions
- Count by status: Compliant / Needs Improvement / Critical Gaps
- Most recent submission with timestamp

**Model Inventory Table:**
- Columns: Model Name, Version, Submission Date, CS Score, OA Score, OM Score, Final Score, Status, Actions
- Sorting: by any column
- Filtering: by status, date range, score range
- Pagination: 10 rows per page

**Score Progression Chart:**
- Line chart showing final compliance score over versions for a selected model
- Visible when a model has 2+ versions

**Recent Activity Feed:**
- Last 10 compliance checks with model name, version, score, timestamp

### 3.8 Model Versioning
- Each submission tied to a user-defined model name (set at time of submission)
- Same model name = new version (v1, v2, v3...)
- Different model name = independent new model
- Version history accessible from Model Inventory Table
- Score progression tracked per model across versions

### 3.9 PDF Report Generation
- Generated server-side via React-PDF
- Triggered by "Download Report" button on submission results page
- Downloaded directly to user's machine — no print dialog
- Report contents:
  - Prova header + logo + submission timestamp
  - Model name and version
  - Final compliance score with pillar breakdown
  - Gap analysis table (severity, element code, pillar, description)
  - Remediation recommendations (sorted by severity)
  - Assessment confidence indicator
  - SR 11-7 reference footer
  - "For training purposes only" disclaimer

### 3.10 Submission History
- All submissions stored in Supabase with RLS
- Stored: model name, version, extracted text, pillar scores, final score, gap analysis (JSONB), judge confidence, timestamp, user ID
- Users can delete individual submissions
- Users can delete all submission history (confirmation required)
- Deleted submission data is hard-deleted, not soft-deleted

### 3.11 Navigation
Navbar links (authenticated):
- Dashboard (`/dashboard`)
- New Check (`/check`)
- History (`/submissions`)
- Help (`/help`)
- Settings (`/settings`)

---

## 4. AI Security & Bias Mitigation

### 4.1 Prompt Injection Protection
All agent prompts wrap document content in XML delimiters. Agents are explicitly instructed to treat document content as data only, never as instructions. See `/docs/AGENT_PROMPTS.md` for exact prompt structure.

Judge agent specifically checks for anomalous scoring patterns as a secondary injection detection layer.

Input sanitization strips HTML tags and script-like content before processing.

### 4.2 LLM Judge Bias Mitigations

**Verbosity bias:** Agents instructed to assess quality and completeness per section, not total word count. Scores normalized by element, not document length.

**Position bias:** Agents required to perform systematic element-by-element assessment in defined order and confirm full document review before scoring.

**Self-enhancement bias:** Judge prompt explicitly requires contrarian review — judge must actively identify weaknesses in each agent assessment before assigning confidence.

**Confidence bias:** All agents required to output explicit confidence score (0.0–1.0) alongside assessment. Uncertainty surfaced to user, never hidden.

See `/docs/AGENT_PROMPTS.md` for exact bias mitigation instructions embedded in each prompt.

### 4.3 Output Schema Validation
Every agent output validated against Zod schema before passing to next stage. Schema validation failure triggers retry (counts toward 2-retry limit). See `/docs/SCHEMAS.md` for exact schemas.

### 4.4 Rate Limiting
- Default: 10 compliance checks per user per hour
- Configurable via `RATE_LIMIT_REQUESTS_PER_HOUR` environment variable
- Rate limit exceeded: clear error message with reset time shown to user

---

## 5. AI-TDD

### 5.1 Synthetic Test Document Suite
7 synthetic documents in `/tests/synthetic/documents/`. See `/docs/TEST_DOCUMENTS.md` for full specs and expected outputs.

| File | Description | Expected Final Score |
|------|-------------|---------------------|
| `test_fully_compliant.txt` | Complete Black-Scholes validation doc | 85–100 |
| `test_missing_conceptual.txt` | CS section absent | CS pillar < 40 |
| `test_missing_outcomes.txt` | No backtesting documentation | OA pillar < 40 |
| `test_missing_monitoring.txt` | No monitoring framework | OM pillar < 40 |
| `test_all_critical_gaps.txt` | Minimal doc, most elements absent | Final < 30 |
| `test_prompt_injection.txt` | Contains injection attempt | Normal scoring, injection ignored |
| `test_verbose_low_quality.txt` | Long but low-substance doc | Score reflects quality not length |

### 5.2 Regression Testing
- Full test suite runs on every prompt change via GitHub Actions
- Score drift alert: flag if any test document score changes by more than 10 points after prompt update
- Test results logged with timestamp and prompt version hash

### 5.3 Eval System
- Every compliance check logged: input hash, agent outputs, scores, judge assessment, timestamp
- Historical metrics: average scores over time, agent agreement rates, retry rates
- Accessible via internal eval dashboard (separate from user dashboard)

---

## 6. Technical Architecture

### 6.1 Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| AI | Anthropic Claude Haiku 3.5 |
| PDF Generation | React-PDF (`@react-pdf/renderer`) |
| PDF Parsing | `pdf-parse` |
| DOCX Parsing | `mammoth` |
| Schema Validation | Zod |
| Error Tracking | Sentry |
| Analytics | Vercel Analytics |
| Deployment | Vercel |
| CI/CD | GitHub Actions |
| Styling | Tailwind CSS |
| Charts | Recharts |

### 6.2 Architecture Pattern
Well-architected monolith. Next.js App Router handles both frontend and API routes. No separate backend service required for MVP.

### 6.3 API Routes
```
POST /api/compliance          — Run compliance check
GET  /api/submissions         — List user submissions
GET  /api/submissions/[id]    — Get single submission
DELETE /api/submissions/[id]  — Delete submission
DELETE /api/submissions       — Delete all submissions
POST /api/report              — Generate PDF report
GET  /api/health              — Health check
```

### 6.4 Compliance Check Flow
```
POST /api/compliance
  1. Verify authenticated session (server-side)
  2. Check rate limit for user
  3. Validate request body against Zod schema
  4. If file: extract text via pdf-parse or mammoth, delete file from memory
  5. Sanitize text: strip HTML, script tags
  6. Wrap text in XML delimiters
  7. Fire three agents in parallel (Promise.all):
       ├── Agent 1: Conceptual Soundness
       ├── Agent 2: Outcomes Analysis
       └── Agent 3: Ongoing Monitoring
  8. Validate all three outputs against AgentOutputSchema (Zod)
  9. If validation fails: retry (count toward max 2)
  10. Fire Judge Agent with three outputs
  11. Judge evaluates consistency, completeness, anomalies
  12. If judge confidence < 0.6 AND retries < 2:
        → All three agents reiterate with original doc + previous outputs
        → Return to step 8
  13. Calculate weighted final score via scoring calculator
  14. Determine gap severity and remediation recommendations
  15. Store results in Supabase (models + submissions + gaps tables)
  16. Return structured ComplianceResponse to client
```

### 6.5 Database Schema
See `/docs/DATABASE.md` for exact SQL including RLS policies and indexes.

**Tables:** `models`, `submissions`, `gaps`
**RLS:** All tables restricted to `auth.uid() = user_id`

### 6.6 Environment Variables
See `CLAUDE.md` — Environment Variables section.

---

## 7. Security

### 7.1 OWASP Top 10
| Risk | Mitigation |
|------|-----------|
| Injection | Input sanitization, parameterized Supabase queries, XML prompt delimiters |
| Broken Auth | Supabase Auth, JWT expiry, RLS on all tables |
| Sensitive Data Exposure | API key server-side only, files deleted post-extraction, HTTPS enforced |
| Security Misconfiguration | All secrets in env vars, no hardcoded credentials, `.env.local` in `.gitignore` |
| XSS | Next.js default escaping, no `dangerouslySetInnerHTML` |
| Broken Access Control | RLS policies, server-side session verification on all API routes |
| Vulnerable Dependencies | Dependabot enabled |
| Logging & Monitoring | Sentry error tracking, Vercel Analytics |

### 7.2 File Upload Security
- Extension + MIME type double validation server-side
- Accepted MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Size enforced server-side
- Files processed in memory only — never written to disk

### 7.3 API Security
- All routes verify authenticated session server-side before processing
- `ANTHROPIC_API_KEY` referenced only in `/src/lib/anthropic/client.ts` (server-side)
- Rate limiting middleware on `/api/compliance`
- Request logging for abuse detection via Sentry

---

## 8. UI/UX Design

### 8.1 Design Direction
Banking-appropriate refined minimalism. Data is the hero. Numbers and scores dominate the visual hierarchy. Trust and precision communicated through restraint.

Reference: `/mnt/skills/user/frontend-design/SKILL.md` for implementation guidance.

### 8.2 Color Palette
```css
--color-bg-primary:     #0A0F1E   /* Deep navy — primary background */
--color-bg-secondary:   #111827   /* Cards, panels */
--color-bg-tertiary:    #1F2937   /* Borders, dividers */
--color-text-primary:   #F9FAFB   /* Off-white — primary text */
--color-text-secondary: #9CA3AF   /* Muted gray — secondary text */
--color-accent:         #3B82F6   /* Sharp blue — CTAs, active states */
--color-compliant:      #10B981   /* Green — compliant */
--color-warning:        #F59E0B   /* Amber — needs improvement */
--color-critical:       #EF4444   /* Red — critical gaps */
--color-border:         #1F2937   /* Subtle borders */
```

### 8.3 Typography
- Display/headings: **Playfair Display** — authoritative, editorial
- Body/data: **IBM Plex Mono** — monospaced for scores and numbers
- UI labels: **Geist** — clean, functional

### 8.4 Key UI Principles
- All scores and percentages rendered in IBM Plex Mono
- Generous whitespace between data elements
- Subtle grain texture overlay on backgrounds
- Sharp corners on data tables (no border-radius)
- Loading states: skeleton screens only, never spinners
- Animations: staggered fade-in on page load, subtle hover states only
- Mobile-web responsiveness: fluid scaling via Tailwind (mobile-first)

### 8.5 Page Routes
```
/                        Landing page
/login              Login
/signup             Signup
/reset-password     Password reset
/dashboard               Main dashboard (authenticated)
/check                   New compliance check
/submissions             All submissions list
/submissions/[id]        Single submission results
/settings                Dashboard preferences + account
/help                    SR 11-7 documentation + how to use Prova
```

---

## 9. CI/CD & DevOps

### 9.1 GitHub Actions Pipeline
```
On Pull Request → main:
  - ESLint
  - TypeScript type check
  - Unit tests (Jest)
  - AI test suite (synthetic documents)
  - Build check

On Merge to main:
  - All PR checks
  - Deploy to Vercel production
  - Sentry release notification
```

### 9.2 Environments
| Environment | Trigger | URL |
|-------------|---------|-----|
| Development | Local | localhost:3000 |
| Preview | PR / feature branch | Vercel preview URL |
| Production | Merge to main | prova.vercel.app |

### 9.3 Monitoring
- **Sentry:** Error tracking, performance, spike alerts
- **Vercel Analytics:** Page views, web vitals
- **Health endpoint:** `GET /api/health` returns 200 with timestamp

---

## 10. Team Process

### 10.1 Sprint Plan
| Sprint | Dates | Deliverables |
|--------|-------|-------------|
| Sprint 1 | Mar 19–29 | Project setup, auth, document input, single agent working end-to-end |
| Sprint 2 | Mar 30–Apr 9 | All three parallel agents, judge agent, scoring, dashboard, PDF reports |
| Sprint 3 | Apr 10–19 | CI/CD, monitoring, security hardening, test suite, documentation, polish |

### 10.2 Division of Responsibilities
| Area | Owner |
|------|-------|
| SR 11-7 agent prompts | Abhishek |
| Scoring logic | Abhishek |
| Compliance API route | Abhishek |
| Supabase schema + RLS | Abhishek |
| Security middleware | Abhishek |
| Input sanitization | Abhishek |
| React frontend components | Teammate |
| Dashboard UI + charts | Teammate |
| CI/CD pipeline | Teammate |
| Vercel deployment | Teammate |
| Sentry + Analytics setup | Teammate |

### 10.3 Code Review Process
- No direct commits to main
- All changes via pull requests
- PRs require review from other team member
- PR description must reference sprint and task

---

## 11. Deliverables Checklist

- [ ] GitHub organization + repository created
- [ ] Production deployment live on Vercel
- [ ] Sentry dashboard accessible to both team members
- [ ] Vercel Analytics dashboard accessible
- [ ] Eval system with historical submission data
- [ ] Synthetic test document suite (7 documents)
- [ ] Complete API documentation
- [ ] System architecture documentation
- [ ] Technical blog post (Medium or dev.to)
- [ ] 20-minute team presentation
- [ ] Individual reflections

---

## 12. Out of Scope (MVP)

- Real confidential bank documents
- Admin user type
- Multi-organization support
- Specific per-gap remediation recommendations (V2)
- GDPR/CCPA compliance documentation
- Mobile app
- QuantLib integration
- Model inventory import/export
- Webhook notifications
- SSO/SAML

---

## 13. Future Roadmap

- Self-hosted deployment package for banks
- Specific per-gap remediation recommendations
- Additional regulatory frameworks (Basel III, CCAR/DFAST)
- Model inventory bulk import
- API access for MRM workflow integration
- Audit trail export for regulators
- Multi-user organization accounts

---

## 14. Technical Specifications

### 14.1 Agent JSON Output Schema
See `docs/SCHEMAS.md` → `AgentOutputSchema` for the authoritative Zod definition and type.

### 14.2 Judge Agent Output Schema
See `docs/SCHEMAS.md` → `JudgeOutputSchema` for the authoritative Zod definition and type.

### 14.3 Scoring Calculation
```
pillarScore = 100 - (criticalGaps × 20) - (majorGaps × 10) - (minorGaps × 5)
pillarScore = max(0, pillarScore)

finalScore = (csScore × 0.40) + (oaScore × 0.35) + (omScore × 0.25)
finalScore = Math.round(finalScore)

status = finalScore >= 80 ? "Compliant"
       : finalScore >= 60 ? "Needs Improvement"
       : "Critical Gaps"
```

### 14.4 Settings Page Toggles
Four dashboard section toggles stored in user preferences (Supabase `user_preferences` table or localStorage fallback):

```typescript
{
  show_overview_panel: boolean,       // default: true
  show_model_inventory: boolean,      // default: true
  show_score_progression: boolean,    // default: true
  show_recent_activity: boolean       // default: true
}
```

### 14.5 SR 11-7 Element Code Reference
See `docs/AGENT_PROMPTS.md` — SR 11-7 Element Code Reference section (all 20 codes with names and pillar weights).

---

## 15. File Structure
See `docs/TECHNICAL_SPECS.md` for the complete annotated file tree.

---

*Document prepared by Abhishek Tuteja | Prova v2.0 | March 2026*
