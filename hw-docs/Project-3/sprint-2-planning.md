# Sprint 2 Planning — Features

**Goal:** Expand from single-agent to full three-pillar parallel assessment with judge validation, build the user-facing features (dashboard, submissions, PDF reports, settings), and reach feature-complete status.

---

## Issues Selected

| Issue | Title | Owner | Priority |
|-------|-------|-------|----------|
| S2-01 | Complete Parallel Agent System (Agents 2, 3, Orchestrator, Judge) | Abhishek | P0 |
| S2-02 | Scoring Calculator | Sandeep | P0 |
| S2-03 | Update POST /api/compliance — Full 3-Agent + Judge + Scoring Flow | Abhishek | P0 |
| S2-04 | Dashboard Page — Overview, Model Inventory, Score Chart, Activity Feed | Sandeep | P1 |
| S2-05 | New Compliance Check Page (/check) | Abhishek | P1 |
| S2-06 | Submission History and Single Submission View | Derek | P1 |
| S2-07 | PDF Report Generation (POST /api/report) | Derek | P1 |
| S2-08 | Settings Page (Dashboard Preferences) | Derek | P2 |

## Key Decisions

- **Three agents in parallel via `Promise.all`** — each pillar runs independently, judge validates after all three complete
- **Never trust agent-reported scores** — `verifyPillarScore` always recalculates from gaps (lesson from Sprint 2 testing where agent scores diverged 20+ points from gap counts)
- **Backend/frontend split for large issues** — S2-06 was the first issue to use the split pattern after a 500+ line diff proved hard to review
- **Work split three ways** — Abhishek on agent/orchestration (S2-01, S2-03, S2-05), Sandeep on scoring + dashboard (S2-02, S2-04), Derek on submissions/PDF/settings (S2-06 through S2-08)

## PRs Merged

| PR | Title | Author |
|----|-------|--------|
| #44 | Complete Parallel Agent System (Agents 2, 3, Orchestrator, Judge) | Abhishek |
| #45 | Scoring Calculator — weighted pillar scores, final score, status | Sandeep |
| #46 | Upgrade compliance route to full 3-agent + judge + scoring flow | Abhishek |
| #47 | Dashboard — overview, inventory, chart, activity feed | Sandeep |
| #48 | Compliance check page — input, results, gap analysis | Abhishek |
| #49 | Settings page | Derek |
| #50 | Submissions | Derek |
| #51 | PDF report | Derek |

## Outcome

All 8 issues completed. Full three-pillar compliance flow working: upload → 3 parallel agents → judge → weighted score → dashboard + submissions + PDF report. App is feature-complete, ready for Sprint 3 production hardening.
