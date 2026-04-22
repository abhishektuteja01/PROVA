---
name: No direct commits to main — enforced at every level
description: PRs only to main — enforced in CLAUDE.md, hooks, and CI. Never bypass even for small fixes.
type: feedback
originSessionId: 4ee2d105-082e-4f5b-acec-87990031da4e
---
Never commit directly to main. Always use a feature branch + PR.

**Why:** A direct push to main in Sprint 1 broke the deploy and took 30 minutes to untangle. After that, added enforcement at three levels: CLAUDE.md rule, PreToolUse hook that blocks `git commit`/`git push` on main, and branch protection on GitHub.

**How to apply:** Even single-line fixes go through a branch. If the hook blocks a commit, that's correct — switch to a feature branch first.
