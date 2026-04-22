# Async Standups

Format: **Did / Doing / Blockers** — posted async in team Slack channel.

---

## Sprint 1 — SR 11-7 Core

**Standup 1 (Week 1, Day 2)**

- **Abhishek:** Set up the repo — Next.js, TypeScript strict, Tailwind, Supabase project. CLAUDE.md written with non-negotiable rules. Starting auth next (S1-03). No blockers.
- **Sandeep:** Supabase schema done (S1-02) — 5 tables with RLS policies, all using `auth.uid() = user_id`. Starting Zod schemas (S1-04). No blockers.

**Standup 2 (Week 1, Day 4)**

- **Abhishek:** Auth working — email/password + Google OAuth + middleware guard (S1-03). Accidentally pushed directly to main and broke the build, took 30 min to fix. Adding branch protection now. Starting Anthropic client (S1-06).
- **Sandeep:** Zod schemas done (S1-04) — loginSchema, signupSchema, documentUploadSchema, all agent output schemas in one file. Starting input sanitization and file parsing (S1-05). No blockers.

**Standup 3 (Week 2, Day 2)**

- **Abhishek:** Conceptual Soundness agent working end-to-end (S1-06). Compliance route returning scores (S1-07). Running production hardening pass now. No blockers.
- **Sandeep:** Sanitization + file parsing done (S1-05) — HTML stripping, `<document>` XML wrapping, PDF and DOCX extraction. Landing page (S1-08) in progress. Blocker: landing page deprioritized, rushing to finish before sprint end.

---

## Sprint 2 — Features

**Standup 1 (Week 3, Day 2)**

- **Abhishek:** Parallel agent system done (S2-01) — Outcomes Analysis + Ongoing Monitoring agents, Judge agent, orchestrator with `Promise.all` and retry loop. Starting compliance route upgrade (S2-03). No blockers.
- **Sandeep:** Scoring calculator done (S2-02) — weighted formula working, `verifyPillarScore` catches agent/gap mismatches. Found agents reporting scores 20+ points off from their gap counts. Starting dashboard (S2-04). No blockers.
- **Derek:** Starting submissions page (S2-06). Using `implement-feature` skill v1 for the first time. No blockers.

**Standup 2 (Week 3, Day 4)**

- **Abhishek:** Compliance route upgraded to full 3-agent + judge + scoring flow (S2-03). Starting check page (S2-05). No blockers.
- **Sandeep:** Dashboard page in progress (S2-04) — overview cards, model inventory table, score chart with Recharts, activity feed. Scoring calculator integrated cleanly with agent output schemas. No blockers.
- **Derek:** S2-06 first attempt produced a 500+ line diff — hard to review. Splitting into backend (API routes) and frontend (pages) for the second attempt. Blocker: resolved by adopting backend/frontend split in skill v2.

**Standup 3 (Week 4, Day 2)**

- **Abhishek:** Check page done (S2-05). All Sprint 2 issues assigned to me are complete. Reviewing Derek's PRs.
- **Sandeep:** Dashboard done (S2-04). Integrated with scoring calculator — no schema changes needed, Zod-first approach from Sprint 1 paid off. Sprint 2 complete for me.
- **Derek:** PDF report (S2-07) done but had rendering quirks with `@react-pdf/renderer` — dynamic content sizing needed several iterations. Settings page (S2-08) done. `prova-github-issues.md` caused a merge conflict on S2-07 — need to be more careful with doc updates.

---

## Sprint 3 — Production

**Standup 1 (Week 5, Day 2)**

- **Derek:** CI/CD pipeline live (S3-01) — lint, typecheck, tests, E2E all in GitHub Actions. First PR after pipeline (#53) failed on lint errors that existed on main from Sprint 2. Created fix PR (#54). Starting AI regression suite (S3-02).
- **Abhishek:** Sentry integration in progress (S3-03). Also starting S3 hardening — API test improvements, report rewrite. Blocker: pdf-parse needs DOM polyfills that break on Vercel serverless.
- **Sandeep:** Starting TDD coverage work (S3-05). Writing failing tests first — `validateFileMagicBytes`, `deriveStatus`, `AgentParseError/AgentSchemaError`. Configuring 70% coverage threshold. No blockers.

**Standup 2 (Week 5, Day 4)**

- **Derek:** AI regression suite done (S3-02) — 7 synthetic documents, 10 test cases, all passing. Score drift detection working. Starting security hardening (S3-04). Running security-reviewer agent in a worktree (`prova-security`).
- **Abhishek:** Still fighting pdf-parse — tried polyfills (#63, #64, #65), reverted, trying again. Going to switch to `unpdf` if this doesn't work. Blocker: Vercel serverless + pdf-parse DOM dependency.
- **Sandeep:** Red-green-refactor cycles complete. All three TDD cycles documented with commits. 70% coverage threshold configured in jest.config.ts. `npm run test:coverage` script added. PR #71 ready for review.

**Standup 3 (Week 6, Day 2)**

- **Derek:** Security audit clean — all 6 control areas passed (S3-04). Help page done (S3-06). Added Playwright E2E, Gitleaks, and AI PR review to pipeline (#70). Sprint 3 complete for me.
- **Abhishek:** Switched pdf-parse to unpdf (#69) — finally working on Vercel. DB robustness improvements done (#66). Claude Code mastery PR (#72) merged — @imports, skills, hooks. Running security-reviewer agent audit (#73). No blockers.
- **Sandeep:** PR #71 merged. Coverage threshold enforced. Helping review PRs for final merge to main. No blockers.
