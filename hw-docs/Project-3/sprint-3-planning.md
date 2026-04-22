# Sprint 3 Planning — Production

**Goal:** Harden the app for production — CI/CD pipeline, automated testing (unit + AI regression + E2E), security audit, error monitoring, and final UI polish. By the end of Sprint 3, the app is deployed, tested, and secure.

---

## Issues Selected

| Issue | Title | Owner | Priority |
|-------|-------|-------|----------|
| S3-01 | GitHub Actions CI/CD Pipeline | Derek | P0 |
| S3-02 | AI Regression Test Suite (Synthetic Documents) | Derek | P0 |
| S3-03 | Sentry Error Tracking and Vercel Analytics | Abhishek | P1 |
| S3-04 | Security Hardening and Penetration Checklist | Derek | P0 |
| S3-05 | Unit Test Coverage — Agents, Scoring, API Routes | Sandeep | P1 |
| S3-06 | Help Page and Final Polish | Derek | P2 |

## Key Decisions

- **CI/CD first** — nothing else merges until the pipeline is green. Lint errors on main (caught post-merge in Sprint 2) motivated this priority.
- **AI regression suite before further prompt changes** — 7 synthetic documents covering compliant, missing-pillar, all-critical, prompt injection, and verbose-low-quality cases. Score drift > 10 points flags a regression.
- **Security audit via worktree** — `security-reviewer` sub-agent runs in a separate worktree (`prova-security`) so the audit doesn't block feature work on main.
- **TDD for all new test code** — red-green-refactor with failing tests committed before implementation. 70% coverage threshold enforced in jest config.
- **Sandeep owns TDD/coverage** — builds the test infrastructure and coverage thresholds while Derek focuses on CI and security.

## PRs Merged

| PR | Title | Author |
|----|-------|--------|
| #52 | CI/CD pipeline | Derek |
| #53 | Help page | Derek |
| #54 | Fix lint errors caught by CI pipeline | Derek |
| #55 | Security audit and hardening checklist | Derek |
| #56 | AI regression suite with 7 synthetic documents | Derek |
| #59–65 | S3 Hardening — API tests, report rewrite, PDF fixes, DB robustness | Abhishek |
| #66 | Database robustness with unique constraints | Abhishek |
| #68–69 | PDF parse polyfill and unpdf refactor | Abhishek |
| #70 | Playwright E2E, Gitleaks secret scanning, AI PR review | Derek |
| #71 | TDD coverage evidence — red-green-refactor + 70% threshold | Sandeep |
| #72 | Claude Code mastery — @imports, skills, hooks, security agent | Abhishek |
| #73 | Security-reviewer agent audit across all API routes and agents | Abhishek |

## Outcome

All 6 issues completed. Full CI/CD pipeline passing (lint, typecheck, tests, E2E, Gitleaks, npm audit, AI review, Vercel deploy). AI regression suite stable at 10/10. Security audit clean. 70% coverage threshold enforced. App production-ready.
