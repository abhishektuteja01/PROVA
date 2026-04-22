# Sprint 1 Planning — SR 11-7 Core

**Goal:** Build the foundation — auth, validation, file parsing, single-agent compliance check, and landing page. By the end of Sprint 1, a user can sign up, upload a document, and get a single-pillar compliance assessment.

**Origin:** Abhishek identified a gap in SR 11-7 compliance tooling while reviewing model documentation at scale — junior validators spend 3-4 hours per document with paper checklists. The idea was approved on the #projects Slack channel.

---

## Issues Selected

| Issue | Title | Owner | Priority |
|-------|-------|-------|----------|
| S1-01 | Project Setup — Next.js, TypeScript, Supabase, Tailwind, Fonts | Abhishek | P0 |
| S1-02 | Supabase Schema, RLS Policies, and Client Setup | Sandeep | P0 |
| S1-03 | Authentication — Email/Password, Google OAuth, Middleware Guard | Abhishek | P0 |
| S1-04 | Zod Schemas — All Validation Types | Sandeep | P0 |
| S1-05 | Input Sanitization and File Parsing | Sandeep | P1 |
| S1-06 | Anthropic Client and Single Agent (Conceptual Soundness) | Abhishek | P1 |
| S1-07 | POST /api/compliance — Sprint 1 Version (Single Agent) | Abhishek | P1 |
| S1-08 | Landing Page and Base Layout | Sandeep | P2 |

## Key Decisions

- **Supabase over custom PostgreSQL** — managed auth + RLS out of the box, faster to production
- **Single agent first** — prove the Conceptual Soundness pillar works end-to-end before parallelizing all three
- **Zod as single source of truth** — all validation schemas in one file, no inline schemas anywhere
- **TypeScript strict from day one** — no `any`, enforced in CLAUDE.md

## PRs Merged

| PR | Title | Author |
|----|-------|--------|
| #35 | Scaffold/initial setup | Abhishek |
| #36 | Sprint 1 auth pages, validation schemas, HW4 workflow | Sandeep |
| #37 | Complete authentication — Google OAuth, reset password, middleware | Abhishek |
| #38 | S1-04: Zod Schemas — All Validation Types | Sandeep |
| #39 | S1-05: Input Sanitization and File Parsing | Sandeep |
| #40 | Anthropic client, Conceptual Soundness agent, Sprint 1 orchestrator | Abhishek |
| #41 | POST /api/compliance — Sprint 1 single-agent route | Abhishek |
| #42 | Compliance route follow-up | Abhishek |
| #43 | Sprint 1 Production Hardening — Security, AI, Frontend, Data Integrity | Abhishek |

## Outcome

All 8 issues completed. Single-agent compliance flow working end-to-end: signup → upload → Conceptual Soundness assessment → score. Foundation ready for Sprint 2 parallelization.
