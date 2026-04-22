# Sprint 2 Retrospective — Features

**Sprint dates:** Weeks 3–4
**Issues completed:** 8/8

---

## What went well

- **Three-way work split was effective** — Abhishek on agent orchestration, Sandeep on scoring + dashboard, Derek on submissions/PDF/settings. Minimal merge conflicts because feature areas were well-isolated.
- **`verifyPillarScore` caught a real problem** — during integration testing, agents reported scores 20+ points off from their own gap counts. Building the recalculation function early (Sprint 2) prevented bad scores from reaching users.
- **`implement-feature` skill matured** — the v1→v2 iteration happened organically during this sprint. Plan-before-execute caught the `ComplianceResults` vs `SubmissionDetail` shape mismatch on S2-06 before any code was written.
- **Dashboard and scoring calculator integrated cleanly** — Sandeep's scoring work and dashboard components consumed the agent output schemas without modification, validating the Zod-first approach from Sprint 1.

## What didn't go well

- **S2-06 produced a 500+ line diff** — first attempt at Submission History was one massive PR. Hard to review thoroughly. This prompted the backend/frontend split rule in the skill's v2.
- **`prova-github-issues.md` caused merge conflicts** — three branches (S2-07, S3-04, S3-06) all updated the issue tracker doc simultaneously. Led to the conflict-aware doc update rule.
- **No automated tests yet** — all validation was manual. Agent output quality was only checked by eyeballing scores. This became the motivation for the AI regression test suite in Sprint 3.
- **PDF report rendering issues** — `@react-pdf/renderer` had quirks with dynamic content sizing that required several iterations to get right.

## Action items for Sprint 3

- [ ] CI/CD pipeline — lint, typecheck, tests, E2E, security scan, deploy (S3-01)
- [ ] AI regression test suite with synthetic documents (S3-02)
- [ ] Security hardening pass (S3-04)
- [ ] Unit test coverage to 70% threshold (S3-05)
- [ ] TDD workflow — commit failing tests before implementation
