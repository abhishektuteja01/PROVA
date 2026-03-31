# Prova — Technical Specifications
**Version:** 1.0 | **Date:** March 19, 2026

<!-- SUMMARY: Canonical file structure for the Prova monorepo.
Use this when scaffolding new files or verifying folder conventions.
For schemas see SCHEMAS.md. For DB DDL see DATABASE.md. For env vars see CLAUDE.md. -->

This document contains the complete annotated file structure. For product requirements, user stories, and feature specs see `docs/PRD.md`.

---

## File Structure

```
prova/
├── .github/
│   └── workflows/
│       ├── pr.yml                        PR checks: lint, typecheck, tests, build
│       └── deploy.yml                    Deploy to Vercel on merge to main
│
├── docs/
│   ├── PRD.md                            Product requirements, features, user stories
│   ├── TECHNICAL_SPECS.md                This document — file structure
│   ├── ARCHITECTURE.md                   System architecture and data flow diagrams
│   ├── AGENT_PROMPTS.md                  All four agent prompt templates (exact text)
│   ├── SCHEMAS.md                        All Zod schemas for agent I/O and API
│   ├── DATABASE.md                       Supabase schema SQL + RLS policies SQL
│   ├── ERROR_STATES.md                   All error states, codes, UI copy, recovery
│   └── TEST_DOCUMENTS.md                 Synthetic test document specs + expected outputs
│
├── src/
│   ├── app/
│   │   ├── (auth)/                       Auth route group (no navbar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── reset-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/                  Authenticated route group (with navbar)
│   │   │   ├── layout.tsx                Navbar + auth guard
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── check/
│   │   │   │   └── page.tsx
│   │   │   ├── submissions/
│   │   │   │   ├── page.tsx              Submissions list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          Single submission results
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── help/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── compliance/
│   │   │   │   └── route.ts              POST — run compliance check
│   │   │   ├── submissions/
│   │   │   │   ├── route.ts              GET all, DELETE all
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts          GET one, DELETE one
│   │   │   ├── report/
│   │   │   │   └── route.ts              POST — generate PDF
│   │   │   └── health/
│   │   │       └── route.ts              GET — health check
│   │   │
│   │   ├── layout.tsx                    Root layout (fonts, Sentry, Analytics)
│   │   ├── page.tsx                      Landing page
│   │   └── globals.css                   CSS variables, base styles
│   │
│   ├── components/
│   │   ├── ui/                           Reusable primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx                 Severity badges (Critical/Major/Minor)
│   │   │   ├── Input.tsx
│   │   │   ├── TextArea.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Skeleton.tsx              Loading skeleton
│   │   │   └── Toast.tsx                 Error/success notifications
│   │   │
│   │   ├── dashboard/
│   │   │   ├── OverviewPanel.tsx         Stats summary cards
│   │   │   ├── ModelInventoryTable.tsx   Sortable/filterable submissions table
│   │   │   ├── ScoreProgressionChart.tsx Recharts line chart
│   │   │   └── RecentActivityFeed.tsx    Last 10 checks
│   │   │
│   │   ├── compliance/
│   │   │   ├── DocumentInput.tsx         Text/file input toggle
│   │   │   ├── FileUpload.tsx            Drag-and-drop file upload
│   │   │   ├── ComplianceResults.tsx     Full results view
│   │   │   ├── PillarScoreCard.tsx       Score + breakdown per pillar
│   │   │   ├── GapAnalysisTable.tsx      Gaps sorted by severity
│   │   │   └── RemediationList.tsx       Recommendations list
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                Top navigation
│   │   │   └── Footer.tsx
│   │   │
│   │   └── report/
│   │       └── ReportDocument.tsx        React-PDF document component
│   │
│   ├── lib/
│   │   ├── agents/
│   │   │   ├── conceptualSoundness.ts    CS agent — calls Claude, returns AgentOutput
│   │   │   ├── outcomesAnalysis.ts       OA agent
│   │   │   ├── ongoingMonitoring.ts      OM agent
│   │   │   ├── judge.ts                  Judge agent — evaluates three outputs
│   │   │   └── orchestrator.ts           Promise.all + retry loop logic
│   │   │
│   │   ├── scoring/
│   │   │   └── calculator.ts             Scoring math — pillar scores + final weighted score
│   │   │
│   │   ├── parsers/
│   │   │   ├── pdf.ts                    pdf-parse wrapper
│   │   │   └── docx.ts                   mammoth wrapper
│   │   │
│   │   ├── validation/
│   │   │   └── schemas.ts                All Zod schemas (see SCHEMAS.md)
│   │   │
│   │   ├── security/
│   │   │   ├── sanitize.ts               Input sanitization (strip HTML, scripts)
│   │   │   └── rateLimit.ts              Rate limiting middleware
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts                 Browser Supabase client
│   │   │   ├── server.ts                 Server-side Supabase client (service role)
│   │   │   └── middleware.ts             Auth session refresh (used by proxy.ts)
│   │   │
│   │   └── anthropic/
│   │       └── client.ts                 Anthropic SDK client — only file with API key
│   │
│   ├── types/
│   │   └── index.ts                      All shared TypeScript types
│   │
│   └── proxy.ts                          Next.js middleware — auth guard on dashboard routes
│
├── tests/
│   ├── agents/
│   │   ├── conceptualSoundness.test.ts
│   │   ├── outcomesAnalysis.test.ts
│   │   ├── ongoingMonitoring.test.ts
│   │   └── judge.test.ts
│   ├── scoring/
│   │   └── calculator.test.ts
│   ├── api/
│   │   └── compliance.test.ts
│   └── synthetic/
│       ├── documents/
│       │   ├── test_fully_compliant.txt
│       │   ├── test_missing_conceptual.txt
│       │   ├── test_missing_outcomes.txt
│       │   ├── test_missing_monitoring.txt
│       │   ├── test_all_critical_gaps.txt
│       │   ├── test_prompt_injection.txt
│       │   └── test_verbose_low_quality.txt
│       └── runner.test.ts                Runs all 7 docs, asserts expected score ranges
│
├── public/
│   └── fonts/                            Self-hosted font files
│
├── .env.local.example                    All env vars with descriptions, no values
├── .env.test                             Test environment variables
├── .gitignore                            Includes .env.local, node_modules
├── CLAUDE.md                             Claude Code instructions
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json                         Strict mode enabled
├── jest.config.ts
└── package.json
```

---

*Prova Technical Specs v1.0 | March 2026*
