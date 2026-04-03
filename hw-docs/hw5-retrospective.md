# HW5 Retrospective: Custom Skill + MCP Integration

**Derek Zhang** | Prova — SR 11-7 Model Documentation Compliance Checker

---

## How the Custom Skill Changed My Workflow

The `implement-feature` skill formalized a workflow that evolved organically across 11 feature implementations. Before creating it, every Claude Code session started with me re-explaining the same context: read the issue spec, follow the CLAUDE.md conventions, use errorResponse() for errors, put schemas in schemas.ts, commit to a feature branch. I was copying and pasting the same boilerplate instructions every time.

The v1 skill captured the baseline workflow — read issue, implement, build, commit, push. It worked, but it was a single-run approach that produced large diffs. When I implemented S2-06 (Submission History), the output was 4 API routes + 2 pages + a modal in one massive diff. Reviewing that in one sitting was overwhelming — I have ADHD, and after carefully reviewing the first two API routes, my attention would drift and I'd start rubber-stamping the rest.

The v2 skill addressed this directly by adding a backend/frontend split. Issues with both API routes and UI pages get implemented in two focused runs. Each diff is 200-250 lines instead of 500+, and each review session has a clear scope. This single change — splitting runs by concern — was the most impactful improvement to my workflow.

The other major v2 addition was the plan-before-execute step. On S2-06's frontend run, the planning step caught a data shape mismatch: the ComplianceResults component expected a ComplianceResponse prop, but the submission detail API returned a different shape (SubmissionDetail). Without planning, Claude Code would have either faked the data or built the wrong abstraction. The plan review caught it, and we chose the correct approach (reuse sub-components directly) before any code was written.

The lint pre-commit check was a lesson learned the hard way. After adding CI in S3-01, both that PR and S3-06 (Help Page) failed because lint errors existed on main that `npm run build` didn't catch. We had to create a separate fix PR, merge it, then rebase both branches. The v2 skill now mandates running lint + typecheck + build before every commit. Since adding that rule, zero CI failures from lint issues.

**Tasks that became easier:**
- Any full-stack feature (API + UI) — the split pattern removes decision fatigue about how to structure the work
- Sprint cleanup — the conventional commit format and doc update pattern make end-of-sprint merges predictable
- Onboarding a new issue — instead of re-explaining conventions, I point Claude Code at the skill

## What MCP Integration Enabled

I connected the GitHub MCP server to Claude Code, which gave it direct access to the repository's issues, pull requests, and CI status without leaving the terminal.

The most immediate value was end-of-sprint cleanup. Manually, closing issues and checking PR status meant opening GitHub in a browser, clicking through each issue, verifying it was done, closing it with a comment, then checking each PR's CI status. With GitHub MCP, I asked Claude Code to list all open issues and PRs, cross-reference them against the issue tracker doc, and give me a summary. One command replaced 10 minutes of clicking through GitHub's UI.

The deeper value is that it closes the loop in the implement-feature workflow. The v2 skill's final step (Push and PR) currently requires me to switch to the GitHub UI to create the PR. With MCP, Claude Code can push the branch AND create the PR with the correct title, description, and closing keyword — all in the same session. The workflow goes from "read issue → implement → push → leave Claude Code → create PR manually" to "read issue → implement → push → PR created → done."

The project health overview was also useful. Asking "show me all open issues and PRs with CI status" gave me an instant dashboard of where the project stood — 22/22 issues closed, 22/22 PRs merged, nothing left open. That's the kind of birds-eye view that normally requires scanning through GitHub's UI across multiple pages.

## What I Would Build Next

**A `/fix-ci` skill.** We hit CI failures 3 times during the project — lint errors, missing ts-node dependency, and broken test files from an interrupted session. Each time, the fix followed the same pattern: read the CI logs, identify the failing step, fix it on main or the feature branch, push, verify. That pattern is automatable. Combined with GitHub MCP (to read CI failure logs directly), this skill could diagnose and fix most CI failures in a single Claude Code session.

**A `/review-pr` skill.** Currently, I review Claude Code's output by reading the code in chat and asking questions. A formalized review skill could: pull the PR diff via GitHub MCP, check it against the codebase conventions (CLAUDE.md rules), verify lint/typecheck/build pass, check for common issues (missing error handling, hardcoded strings, missing Zod validation), and produce a review summary. This would be especially useful for reviewing my partner's PRs where I need to verify their code follows the same conventions.

**Pre-commit hooks.** The v2 skill mandates running lint + typecheck + build before committing, but it's still voluntary — Claude Code follows the instruction because the skill says to, but nothing enforces it mechanically. A Husky pre-commit hook that runs `npm run lint && npm run typecheck` would make this a hard gate rather than a soft instruction. Combined with the existing CI pipeline, this creates defense in depth: pre-commit catches issues before they're committed, CI catches anything that slips through.

**Sub-agents for parallel execution.** The v2 skill documents which issues can run in parallel, but the actual parallelization is manual — I open two Claude Code sessions and run separate prompts. A sub-agent system could automatically identify independent tasks from the issue tracker and dispatch them to parallel sessions, then collect and merge the results. This is ambitious but would be the natural evolution of the parallel execution pattern we used for S3-04 + S3-05 and S3-01 + S3-06.
