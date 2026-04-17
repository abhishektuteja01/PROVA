# Anthropic Client — CLAUDE.md

Rules for the Anthropic API client and all LLM call configuration.

---

## Required Reading
- `src/lib/agents/CLAUDE.md` — agent architecture that consumes this client
- `docs/AGENT_PROMPTS.md` — prompt templates; token budgets flow from here

---

## Non-Negotiable Rules

**API key isolation:**
- `ANTHROPIC_API_KEY` is consumed **only** in this folder (`client.ts`) — never import or access it elsewhere
- Export a typed `anthropic` client instance; never export the raw key

**Model:**
- Canonical model string: `claude-haiku-4-5-20251001` — defined once here, imported by agents
- Do not hardcode the model string in any other file

**Token limits:**
- Max tokens per agent call: 3000 — enforced at call site in this client
- Do not raise this limit without updating `docs/AGENT_ARCHITECTURE.md`

**Error handling:**
- Wrap all Anthropic SDK calls in typed error handlers — surface `AnthropicError` subtypes, never swallow
- On rate-limit (429): propagate `RATE_LIMIT_EXCEEDED` error code from `src/lib/errors/messages.ts`
- On timeout: propagate `AGENT_TIMEOUT` error code

**No direct usage outside agents:**
- Only files in `src/lib/agents/` may import from this folder
- API routes must go through the agent layer, never call the Anthropic client directly
