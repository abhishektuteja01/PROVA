<div align="center">

# Prova

**Know what's missing before regulators do.**

SR 11-7 model documentation compliance checker powered by parallel AI agents.
Upload a model doc → get a gap analysis, compliance score, and PDF report in minutes.

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![Anthropic](https://img.shields.io/badge/Claude_Haiku_3.5-D97757?style=flat&logo=anthropic&logoColor=white)](https://anthropic.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## Overview

Prova automates SR 11-7 compliance review — the Federal Reserve's framework for model risk management. Instead of spending 3–4 hours manually checking documentation against regulatory checklists, validators get a structured assessment in minutes.

Three Claude agents run in parallel, each covering one SR 11-7 validation pillar. A judge agent validates consistency. A weighted score and remediation report are produced automatically.

> Designed for training and synthetic model documents. Architecture supports future self-hosted deployment within bank infrastructure.

---

## How it works

```
Upload / paste model documentation
            │
            ▼
  ┌─────────────────────────────────────────┐
  │         Three parallel AI agents         │
  │                                          │
  │  Conceptual    Outcomes    Ongoing       │
  │  Soundness  ·  Analysis  · Monitoring   │
  │  (CS-01→07)   (OA-01→07)  (OM-01→06)   │
  └─────────────────────────────────────────┘
            │
            ▼
      Judge agent validates
      consistency + confidence
            │
            ▼
  Weighted score  ·  Gap analysis  ·  PDF report
  CS×0.40 + OA×0.35 + OM×0.25
```

**Compliance statuses:** `Compliant` · `Needs Improvement` · `Critical`
**Gap severities:** `Critical` · `Major` · `Minor`

---

## Features

- **Parallel assessment** — three agents run concurrently via `Promise.all`, judge validates with retry logic (max 2 retries)
- **Weighted scoring** — pillar scores combined into a 0–100 final score with a confidence label
- **Gap analysis** — every identified gap includes element code, severity, description, and a specific recommendation
- **PDF reports** — downloadable audit-ready reports generated server-side with `@react-pdf/renderer`
- **Dashboard** — portfolio view showing score trends, model inventory, and recent submissions
- **Secure by default** — RLS on all tables, server-side session verification on every API route, files never written to disk

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router · TypeScript strict |
| Auth & Database | Supabase (PostgreSQL + Auth + Row Level Security) |
| AI | Anthropic Claude Haiku 3.5 (`claude-haiku-3-5-20241022`) |
| PDF | `@react-pdf/renderer` |
| Document parsing | `pdf-parse` (PDF) · `mammoth` (DOCX) |
| Validation | Zod — all schemas in `src/lib/validation/schemas.ts` |
| Styling | Tailwind CSS · Instrument Serif · IBM Plex Mono · Geist |
| Charts | Recharts |
| Monitoring | Sentry · Vercel Analytics |
| Deployment | Vercel |

---

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key

### 1. Clone and install

```bash
git clone <repo-url>
cd prova
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in all values. See `.env.local.example` for descriptions of each variable.

### 3. Set up the database

Run the SQL from [`docs/DATABASE.md`](docs/DATABASE.md) in your **Supabase SQL Editor**, in order. This creates all tables, indexes, RLS policies, and triggers.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Commands

```bash
npm run dev           # Start development server
npm run build         # Type check + production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm test              # Jest unit tests
npm run test:ai       # AI regression suite — run after any agent or scoring change
```

---

## Environment variables

See `.env.local.example` for the full annotated list.

| Variable | Scope | Used in |
|---|---|---|
| `ANTHROPIC_API_KEY` | Server only | `src/lib/anthropic/client.ts` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase browser + server clients |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Public | `src/lib/supabase/client.ts` |
| `SUPABASE_SECRET_KEY` | Server only | `src/lib/supabase/server.ts` |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | `sentry.client.config.ts` |
| `SENTRY_DSN` | Server only | `instrumentation.ts` |
| `SENTRY_ORG` | Build-time | `next.config.ts` (source maps) |
| `SENTRY_PROJECT` | Build-time | `next.config.ts` (source maps) |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical URL |
| `RATE_LIMIT_REQUESTS_PER_HOUR` | Server only | Default: `10` |

---

## Project structure

```
prova/
├── src/
│   ├── app/
│   │   ├── (auth)/               # Login, signup pages
│   │   ├── (dashboard)/          # Protected app pages
│   │   └── api/                  # compliance · submissions · report · health
│   ├── components/               # Shared React components
│   ├── lib/
│   │   ├── anthropic/            # SDK client — API key lives here only
│   │   ├── agents/               # Three assessment agents + judge + orchestrator
│   │   ├── scoring/              # Weighted scoring calculator
│   │   ├── parsers/              # PDF and DOCX extraction
│   │   ├── security/             # Sanitization, rate limiting
│   │   ├── supabase/             # Browser, server, and middleware clients
│   │   └── validation/           # All Zod schemas (schemas.ts only)
│   ├── types/                    # Shared TypeScript types
│   └── proxy.ts                  # Auth guard for all dashboard routes
├── docs/
│   ├── PRD.md                    # Full product requirements
│   ├── ARCHITECTURE.md           # System architecture + data flow
│   ├── DATABASE.md               # Schema, indexes, RLS policies + setup SQL
│   ├── SCHEMAS.md                # API Zod schema reference
│   ├── ERROR_STATES.md           # All user-facing error messages
│   └── AGENT_PROMPTS.md          # SR 11-7 agent prompt specifications
├── tests/                        # Jest unit + AI regression tests
├── CLAUDE.md                     # AI assistant instructions
└── .env.local.example            # Environment variable reference
```

---

## Documentation

| Doc | Contents |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Full product spec, UI design system, scoring rules |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, data flow, agent orchestration |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Schema, RLS policies, setup SQL |
| [`docs/SCHEMAS.md`](docs/SCHEMAS.md) | API request/response Zod schemas |
| [`docs/ERROR_STATES.md`](docs/ERROR_STATES.md) | All user-facing error messages (source of truth) |
| [`docs/AGENT_PROMPTS.md`](docs/AGENT_PROMPTS.md) | SR 11-7 agent prompt specifications |

---

## Security

- `ANTHROPIC_API_KEY` and `SUPABASE_SECRET_KEY` are server-side only — never referenced in client code
- All document text is wrapped in XML delimiters before being passed to any agent
- File uploads are parsed in memory and never written to disk
- RLS policies enforce strict `user_id` isolation at the database level
- Every API route re-verifies the session server-side (defense in depth)
- `dangerouslySetInnerHTML` is banned across the entire codebase

---

<div align="center">

*Built for training and synthetic model documents.*
*Not for use with real confidential bank documentation in current deployment.*

</div>
