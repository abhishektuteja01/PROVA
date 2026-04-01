# Compliance Components — CLAUDE.md

Rules for all compliance check components under `src/components/compliance/`.

---

## Required Reading
- `docs/UI_DESIGN.md` — colors, typography, UI principles
- `src/components/CLAUDE.md` — shared component rules
- `src/app/api/CLAUDE.md` — compliance API contract
- `docs/SCHEMAS.md` — request/response schemas

---

## Design Rules
- All scores/percentages: **IBM Plex Mono** (`var(--font-ibm-plex-mono)`)
- UI labels: **Geist** (`var(--font-geist)`)
- Colors: CSS variables only — never hardcode hex
- Status thresholds: >=80 Compliant (green), >=60 Needs Improvement (amber), <60 Critical Gaps (red)
- Loading: skeleton screens only, never spinners
- Gap table: sharp corners, sorted Critical → Major → Minor
- Severity badges: colored by severity level

## API Integration
- `POST /api/compliance` — FormData (file) or JSON (text paste)
- Response type: `ComplianceResponse` from `src/lib/validation/schemas.ts`
- Handle 429 (rate limit), 400 (validation), 500 (server error)
- Compliance checks take 10–30 seconds — show skeleton during wait

## Validation
- Model name: required, max 200 chars, alphanumeric + basic punctuation
- Text paste: minimum 100 characters
- File upload: .pdf or .docx only, max 10MB
- All validation schemas in `src/lib/validation/schemas.ts`
