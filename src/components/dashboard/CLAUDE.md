# Dashboard Components — CLAUDE.md

Rules for all dashboard components under `src/components/dashboard/`.

---

## Required Reading
- `docs/DASHBOARD.md` — dashboard sections, versioning, settings toggles
- `docs/UI_DESIGN.md` — colors, typography, UI principles
- `src/components/CLAUDE.md` — shared component rules (fonts, colors, skeletons, animations)

---

## Design Rules
- All scores/percentages: **IBM Plex Mono** (`var(--font-ibm-plex-mono)`)
- Section headings: **Playfair Display** (`var(--font-playfair)`)
- UI labels: **Geist** (`var(--font-geist)`)
- Colors: CSS variables only — never hardcode hex
- Status thresholds: >=80 Compliant (green), >=60 Needs Improvement (amber), <60 Critical Gaps (red)
- Loading: skeleton screens only, never spinners
- Tables: sharp corners (no border-radius)
- Animations: staggered fade-in via Framer Motion

## Data Flow
- Dashboard page (`page.tsx`) is a server component — fetches all data from Supabase
- Each section component is `"use client"` — receives data as props
- Section visibility controlled by `user_preferences` table (defaults: all true)

## Helpers
- `utils.ts` — shared helpers: `getScoreColor()`, `getStatusFromScore()`, `timeAgo()`
