# Prova — Known Issues

## Benchmark corpus counts model versions, not unique models

`get_benchmark_stats()` counts each submission row with
`parent_assessment_id IS NULL`. A model with v1, v2, v3 contributes 3 rows
to `corpus_n`, 3 votes to median calculations, and 3 potential hits to
`top_gaps` frequencies. Today: 10 unique models across 12 rows. Decision
needed: count latest version per model (Option B, recommended) or first
version per model (Option C). If Option B: add a `latest_per_model` CTE
using `DISTINCT ON (model_id) ORDER BY model_id, version_number DESC`,
replace `scoped` with `latest_per_model` in `totals` and `top_gaps_calc`
CTEs, update the disclosure label from "N=X assessments" to "N=X models",
update API tests.

## BenchmarksView focal score displays as 0

At least one assessment shown as the focal point in `/dashboard/benchmarks`
renders "FINAL SCORE 0" in the header despite having a real score in the
database. Likely a data fetch reading the wrong row or column. May share a
root cause with the doubled version-number issue below.

## Model name displays version number twice

`/dashboard/benchmarks` header shows model name as "VaR report v1 v1"
(version doubled). Likely a string concatenation combining `model_name`
with `version_number` where `model_name` already contains the version.

## Re-assessment gap-list / dispute_resolution may disagree

Compare view's gap diff classification can differ from the agent's stated
`dispute_resolution` due to non-zero LLM temperature producing minor
gap-list variation across runs. The `dispute_resolution` field is the
source of truth for the agent's reasoning on each disputed gap; the
`gap_diff` is informational. From P1.5 smoke testing.
