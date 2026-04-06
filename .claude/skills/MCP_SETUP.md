# MCP Setup: Supabase MCP Server

## Why Supabase MCP?

Prova stores all assessment results in Supabase — pillar scores, gap arrays, judge outputs, confidence levels, and user settings. During backend development, debugging agent outputs required repeatedly switching between Claude Code (where prompt changes happen) and the Supabase dashboard (where results land). Supabase MCP eliminates that context switch by giving Claude Code direct read access to the database.

## Setup

### 1. Install the Supabase MCP Server

```bash
claude mcp add supabase -- npx -y @anthropic-ai/supabase-mcp --supabase-url https://YOUR_PROJECT.supabase.co --supabase-key YOUR_SERVICE_ROLE_KEY
```

Replace `YOUR_PROJECT` and `YOUR_SERVICE_ROLE_KEY` with values from your Supabase project settings. Use the **service role key** (not the publishable key) — this server runs locally and needs full read access for debugging.

### 2. Verify Connection

In Claude Code, run:
```
List all tables in the Supabase database
```

Expected output should show the Prova schema tables:
- `submissions` — assessment records with model name, version, status
- `submission_results` — pillar scores, gaps, judge output, confidence
- `user_settings` — dashboard toggle preferences
- `profiles` — user metadata from Supabase Auth

### 3. Environment Notes

- The MCP server runs as a local process managed by Claude Code
- It uses the Supabase Management API and SQL execution capabilities
- RLS is bypassed when using the service role key — this is intentional for debugging but means this configuration should NOT be used in shared/production environments
- For team members: each developer configures their own local MCP connection with their own service role key

## What It Enables

### Workflow 1: Post-Assessment Score Inspection
After running `npm run test:ai`, query the database to inspect what was actually persisted:

```
Show me the most recent submission results ordered by created_at DESC. Include pillar scores, final score, and critical gap count.
```

This catches mismatches between what the orchestrator returns in-memory and what actually gets written to Supabase — for example, if a Zod transform silently drops a field before insert.

### Workflow 2: Score Drift Comparison Across Runs
Compare scores from today's test run against yesterday's:

```
Show me all submission_results for model_name = 'Test Black-Scholes Model' from the last 7 days, ordered by created_at. Show final_score and pillar breakdowns.
```

This creates a time-series view of how scores evolve across prompt iterations — the same data that the CI drift gate checks, but queryable ad hoc.

### Workflow 3: Gap Analysis Debugging
When an agent flags an unexpected gap, query the stored gap array directly:

```
Show me the gaps array from the most recent submission_result where the conceptual_soundness_score is below 50. Include severity, element_code, and description for each gap.
```

This is faster than re-running the agent — the gap data is already in the database from the last test run.

### Workflow 4: RLS Policy Verification
After modifying Row Level Security policies, verify they work correctly:

```
Run this query as a specific user: SELECT * FROM submissions WHERE user_id != 'current-user-id'
```

If RLS is correctly configured, this should return zero rows. This catches the common mistake of forgetting to add a policy after creating a new table or column.

## Security Notes

- **Never commit the service role key** — it's set via environment variable only
- **Local use only** — this MCP configuration gives full database access and is for development debugging, not production use
- **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY** is the frontend key (safe to expose); the service role key used here is the backend secret that bypasses RLS
- The separation between `createClient` (session-aware, RLS-enforced) and `createServiceClient` (service role, RLS-bypassed) in `src/lib/supabase/server.ts` must be maintained — the MCP server effectively acts like `createServiceClient`
