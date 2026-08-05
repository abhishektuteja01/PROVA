# Dashboard & Versioning

Focused reference for dashboard work — sections, versioning, and settings toggles.

---

## Dashboard Sections

All users see same base dashboard. Users can hide/show sections in Settings > Dashboard Preferences.

### Overview Panel
- Total models submitted
- Average compliance score across all submissions
- Count by status: Compliant / Needs Improvement / Critical Gaps
- Most recent submission with timestamp

### Model Inventory Table
- Sortable columns (`COLUMNS` in `ModelInventoryTable.tsx`): Model Name,
  Version, Submission Date, CS, OA, OM, Final
- Status is rendered as a badge in its own cell, derived from the final score
  rather than stored — it is not a sortable column
- Filtering: by status, date range, score range
- Pagination: 10 rows per page

### Score Progression Chart
- Line chart (Recharts) showing final compliance score over versions for a selected model
- Visible when a model has 2+ versions

### Recent Activity Feed
- Last 10 compliance checks with model name, version, score, timestamp

---

## Model Versioning

- Each submission tied to a user-defined model name (set at time of submission)
- Same model name = new version (v1, v2, v3...)
- Different model name = independent new model
- Version history accessible from Model Inventory Table
- Score progression tracked per model across versions

---

## Settings Page Toggles

Four dashboard section toggles stored in the Supabase `user_preferences`
table. There is no localStorage fallback — preferences are read server-side
during dashboard render, so a signed-in session is always required:

```typescript
{
  show_overview_panel: boolean,       // default: true
  show_model_inventory: boolean,      // default: true
  show_score_progression: boolean,    // default: true
  show_recent_activity: boolean       // default: true
}
```

---

## Benchmarks View

A separate page at `/dashboard/benchmarks`
(`src/components/dashboard/BenchmarksView.tsx`), linked from the main nav.
Unlike the four sections above it has **no settings toggle** — it is always
available.

- Compares one of the user's own assessments against corpus medians for the
  same `model_type` (CS / OA / OM / final)
- Cross-user aggregates come exclusively from the `get_benchmark_stats` RPC,
  never a direct table read — the `SECURITY DEFINER` function is the only
  path by which another user's data influences what is displayed, and it
  returns aggregates only
- Top gap elements are returned as `element_code` + `element_name` +
  frequency, never gap descriptions or recommendations
- When the bucket holds fewer than `BENCHMARK_MIN_CORPUS_N` (5) submissions,
  medians are suppressed and the UI renders an explicit
  "Insufficient corpus (N=X)" state rather than a misleading comparison
- The model picker lists the signed-in user's own submissions only, scoped by
  RLS on the base select
