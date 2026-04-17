# Dashboard Components — CLAUDE.md

Rules for all dashboard components under `src/components/dashboard/`.

---

## Required Reading
- `docs/DASHBOARD.md` — dashboard sections, versioning, settings toggles
- `docs/UI_DESIGN.md` — colors, typography, UI principles

## Data Flow
- Dashboard page (`page.tsx`) is a server component — fetches all data from Supabase
- Each section component is `"use client"` — receives data as props
- Section visibility controlled by `user_preferences` table (defaults: all true)

## Helpers
- `utils.ts` — shared helpers: `getScoreColor()`, `getStatusFromScore()`, `timeAgo()`
