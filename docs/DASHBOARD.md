# Dashboard & Versioning

Extracted from PRD Sections 3.7–3.8, 14.4. This is the focused reference for dashboard work.

---

## Dashboard Sections

All users see same base dashboard. Users can hide/show sections in Settings > Dashboard Preferences.

### Overview Panel
- Total models submitted
- Average compliance score across all submissions
- Count by status: Compliant / Needs Improvement / Critical Gaps
- Most recent submission with timestamp

### Model Inventory Table
- Columns: Model Name, Version, Submission Date, CS Score, OA Score, OM Score, Final Score, Status, Actions
- Sorting: by any column
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

Four dashboard section toggles stored in user preferences (Supabase `user_preferences` table or localStorage fallback):

```typescript
{
  show_overview_panel: boolean,       // default: true
  show_model_inventory: boolean,      // default: true
  show_score_progression: boolean,    // default: true
  show_recent_activity: boolean       // default: true
}
```
