# MCP Integration: GitHub MCP Server

## Why GitHub MCP?

Throughout the Prova development workflow, we manually performed GitHub operations:
- Closing issues after implementation (`gh issue close #31`)
- Creating PRs with descriptions (`gh pr create --title ... --body ...`)
- Checking CI status on PRs
- Managing branches after merge

GitHub MCP allows Claude Code to perform these operations directly during the `implement-feature` workflow, eliminating the manual step between "code is pushed" and "PR is created with the right description and closing keywords."

## Setup

### 1. Install the GitHub MCP Server

In your terminal (not inside Claude Code):

```bash
claude mcp add github -- npx -y @modelcontextprotocol/server-github
```

This registers the GitHub MCP server with Claude Code. The server uses the `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable for authentication.

### 2. Create a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it "Claude Code MCP"
4. Select scopes: `repo` (full control of private repositories)
5. Generate and copy the token

### 3. Configure the Token

Add the token to your shell environment. In `~/.zshrc` (or `~/.bashrc`):

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
```

Then reload: `source ~/.zshrc`

### 4. Verify the Connection

Open Claude Code in the Prova project and ask:

```
List the open issues in the abhishektuteja01/PROVA repository
```

If configured correctly, Claude Code will use the GitHub MCP to query the repo and list issues.

## Demonstrated Workflows

### Demo 1: Automated PR Creation with Issue Closing

Instead of manually running `gh pr create`, the implement-feature skill can now ask Claude Code to:

```
Create a pull request in abhishektuteja01/PROVA:
- Branch: feat/s3-02-ai-regression
- Base: main
- Title: "test(S3-02): AI regression suite with 7 synthetic documents"
- Body: Include summary, file list, and "Closes #30"
```

Claude Code uses the GitHub MCP `create_pull_request` tool to do this without leaving the session.

### Demo 2: Issue Status Management

After merging a PR, close related issues:

```
Close issue #31 in abhishektuteja01/PROVA with a comment:
"Already implemented by partner — Sentry client config, instrumentation.ts, withSentryConfig in next.config.ts, and Vercel Analytics all present."
```

### Demo 3: CI Status Check

After pushing a branch, check if CI passed:

```
Check the status of the latest CI run on PR #55 in abhishektuteja01/PROVA.
If it failed, show me the failing step.
```

### Demo 4: Repository Health Overview

Get a full picture of project status:

```
Show me all open issues and open PRs in abhishektuteja01/PROVA.
For each PR, show whether CI is passing or failing.
```

## How This Enhances the implement-feature Skill

The v2 skill's Step 9 (Push and PR) currently instructs the user to manually create a PR. With GitHub MCP, Claude Code can:

1. Push the branch (git)
2. Create the PR with the correct title, body, and closing keyword (GitHub MCP)
3. Wait for CI to run and report the result (GitHub MCP)
4. If CI fails, read the failure logs and suggest a fix (GitHub MCP + git)

This closes the loop — the entire workflow from "read issue" to "PR ready for review" happens in a single Claude Code session without switching to the GitHub UI.

## What This Enables That Wasn't Possible Before

Without MCP:
- Push code → switch to GitHub UI → manually create PR → copy-paste description → manually close issues
- CI fails → switch to GitHub UI → click into the failing run → read logs → switch back to Claude Code

With MCP:
- Push code → Claude Code creates PR → Claude Code monitors CI → Claude Code reads failure logs and fixes → all in one session
- End-of-sprint cleanup (closing issues, checking all PRs, branch cleanup) is a single conversation

## Limitations

- GitHub MCP requires a personal access token with `repo` scope — treat it like a password
- The token gives full repo access — don't use a token with more scopes than needed
- Rate limits apply (5,000 requests/hour for authenticated users)
- Cannot trigger CI reruns directly (GitHub Actions API limitation) — but can read CI status
