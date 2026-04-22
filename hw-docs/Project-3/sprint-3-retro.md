# Sprint 3 Retrospective — Production

**Sprint dates:** Weeks 5–6
**Issues completed:** 6/6

---

## What went well

- **CI/CD caught issues immediately** — first PR after pipeline was added (#53) failed on lint errors that had been invisible during Sprint 2. The pipeline paid for itself on day one.
- **AI regression suite is stable** — 7 synthetic documents, 10 test cases, all passing. Score drift detection working. Gives confidence to iterate on prompts without breaking existing behavior.
- **Security audit found nothing critical** — all 6 control areas passed. The security-first approach in CLAUDE.md (API key isolation, RLS, `<document>` delimiters) meant the audit was confirmatory, not corrective.
- **Worktree parallelism worked** — security audit ran in `prova-security` worktree while AI regression tests were built on main. No blocking, no conflicts.
- **TDD coverage threshold enforced** — Sandeep's 70% coverage config means tests can't silently drop below the bar. Red-green-refactor cycle documented in git history.

## What didn't go well

- **PDF parsing was painful** — `pdf-parse` required DOM polyfills that broke on Vercel serverless. Took PRs #59 through #69 (multiple reverts and re-lands) before switching to `unpdf`. Should have evaluated serverless compatibility earlier.
- **Sprint 2 lint debt carried over** — lint errors on main caused CI failures on the first Sprint 3 PRs. Required a dedicated fix PR (#54) and rebasing two branches. Reinforced the importance of the lint pre-commit rule in the `implement-feature` skill.
- **`prova-github-issues.md` status tracking outdated** — S3-02 and S3-03 still show as Pending in the doc despite being completed. Manual doc updates don't scale.

## What we'd do differently

- Evaluate library serverless compatibility before adopting (pdf-parse lesson)
- Add CI pipeline in Sprint 1, not Sprint 3 — would have caught lint/type issues much earlier
- Use GitHub Projects board for status tracking instead of a markdown file
