# UI/UX Design

Focused reference for component work — colours, typography, and UI principles.

---

## Design Direction
Banking-appropriate refined minimalism. Data is the hero. Numbers and scores dominate the visual hierarchy. Trust and precision communicated through restraint.

## Color Palette
```css
--color-bg-primary:     #0A0F1E   /* Deep navy — primary background */
--color-bg-secondary:   #111827   /* Cards, panels */
--color-bg-tertiary:    #1F2937   /* Borders, dividers */
--color-text-primary:   #F9FAFB   /* Off-white — primary text */
--color-text-secondary: #9CA3AF   /* Muted gray — secondary text */
--color-accent:         #3B82F6   /* Sharp blue — CTAs, active states */
--color-compliant:      #10B981   /* Green — compliant */
--color-warning:        #F59E0B   /* Amber — needs improvement */
--color-critical:       #EF4444   /* Red — critical gaps */
--color-border:         #1F2937   /* Subtle borders */
```

All colors defined as CSS variables in `globals.css` — **never hardcode hex values**.

The ten above are the core tokens, exposed as Tailwind utilities via
`tailwind.config.ts` (`bg-primary`, `text-critical`, `border`, …).
`globals.css` defines 32 `--color-*` tokens in total: the ten core ones plus
22 derived tints, borders and rules layered on top — `--color-accent-light`,
`--color-compliant-bg`, `--color-compliant-border`,
`--color-text-secondary-dim`, `--color-white-divider` and similar.

Read `globals.css` before introducing a new colour; the derived token you
need usually already exists. Note the set is not symmetrical — `compliant`
has `-bg` and `-border` variants while `critical` and `warning` do not, so
check rather than assume a variant exists.

## Typography
- Display/headings: **Playfair Display** — authoritative, editorial
- Body/data: **IBM Plex Mono** — monospaced for scores and numbers
- UI labels: **Geist** — clean, functional
- Never use: Inter, Roboto, Arial

## UI Principles
- All scores and percentages rendered in IBM Plex Mono
- Generous whitespace between data elements
- Subtle grain texture overlay on backgrounds
- Sharp corners on data tables (no border-radius)
- Loading states: skeleton screens only, never spinners
- Animations: staggered fade-in on page load, subtle hover states only
- Mobile-web responsiveness: fluid scaling via Tailwind (mobile-first)
- Never use: purple gradients, generic AI aesthetics
- No `dangerouslySetInnerHTML` anywhere

## Page Routes
```
/                    Landing page
/login               Login
/signup              Signup
/reset-password      Password reset
/dashboard           Main dashboard (authenticated)
/dashboard/benchmarks  Corpus benchmark comparison by model type
/check               New compliance check
/submissions         All submissions list
/submissions/[id]    Single submission results
/settings            Dashboard preferences + account
/help                SR 11-7 documentation + how to use Prova
```
