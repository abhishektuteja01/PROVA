# Components — CLAUDE.md

Rules for all React components under `src/components/`.

---

## Required Reading
- `docs/UI_DESIGN.md` — colors, typography, UI principles, page routes
- `docs/DASHBOARD.md` — dashboard sections, versioning, settings toggles

---

## Design Direction
Banking-appropriate refined minimalism. Data is the hero. Trust and precision communicated through restraint.

## Typography
- Display/headings: **Playfair Display**
- Scores/numbers/data: **IBM Plex Mono** — all scores and percentages must use this
- UI labels: **Geist**
- Never use: Inter, Roboto, Arial

## Colors
- Defined as CSS variables in `globals.css` — **never hardcode hex values**
- Compliant (80–100): green (`--color-compliant`)
- Needs Improvement (60–79): amber (`--color-warning`)
- Critical Gaps (0–59): red (`--color-critical`)

## UI Rules
- Loading states: **skeleton screens only, never spinners**
- No `dangerouslySetInnerHTML` anywhere
- Generous whitespace between data elements
- Sharp corners on data tables (no border-radius)
- Animations: staggered fade-in on page load, subtle hover states only
- Mobile-web responsiveness: fluid scaling via Tailwind (mobile-first)
- Never use: purple gradients, generic AI aesthetics

## Navbar Links (authenticated)
Dashboard · New Check · History · Help · Settings
