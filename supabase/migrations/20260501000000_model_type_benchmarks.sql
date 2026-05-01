-- Model-type tagging + corpus benchmarks.
--
-- Goals:
--   1. Tag every assessment with a model_type (so we can group benchmarks by
--      comparable model classes) and an is_synthetic flag (so synthetic
--      training docs do not silently inflate real-corpus statistics).
--   2. Expose corpus aggregates across users without relaxing RLS on the
--      underlying submissions/gaps tables. Privacy boundary lives in two
--      SECURITY DEFINER functions: only aggregates leave them — never
--      row-level submission content, gap descriptions, or user IDs.

-- 1. model_type enum ----------------------------------------------------------

CREATE TYPE public.model_type AS ENUM (
  'credit_risk_pd_lgd_ead',
  'allowance_cecl_ifrs9',
  'market_risk_var',
  'alm_irrbb',
  'stress_testing_ccar',
  'aml_fraud',
  'credit_decisioning',
  'other'
);

-- 2. Columns on submissions ---------------------------------------------------

ALTER TABLE public.submissions
  ADD COLUMN model_type public.model_type NOT NULL DEFAULT 'other';

ALTER TABLE public.submissions
  ADD COLUMN is_synthetic BOOLEAN NOT NULL DEFAULT FALSE;

-- Composite index supports the benchmark function's filter + count path.
CREATE INDEX idx_submissions_model_type_is_synthetic
  ON public.submissions(model_type, is_synthetic);

-- 3. get_benchmark_stats ------------------------------------------------------
--
-- Returns aggregate corpus statistics for one model_type bucket. SECURITY
-- DEFINER lets it read across all users' submissions without relaxing RLS on
-- the base tables — the function is the only authorised path for cross-user
-- aggregates to leave the database.
--
-- Privacy guarantees, enforced inside the function body:
--   * Never returns user_id, submission_id, document_text, or any raw gap
--     description / recommendation.
--   * top_gaps returns element_code + element_name + frequency only.
--   * Caller-side responsibility: the API layer additionally suppresses the
--     numeric medians when corpus_n < 5 to prevent N=1 inference attacks
--     where a single-row median would equal another user's exact score.
--
-- We intentionally still return the small-N corpus_n itself so the UI can
-- render an honest "Insufficient corpus (N=X)" message rather than silently
-- failing.

CREATE OR REPLACE FUNCTION public.get_benchmark_stats(
  model_type_filter public.model_type,
  include_synthetic  BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  corpus_n     INTEGER,
  synthetic_n  INTEGER,
  real_n       INTEGER,
  cs_median    NUMERIC,
  oa_median    NUMERIC,
  om_median    NUMERIC,
  final_median NUMERIC,
  top_gaps     JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH scoped AS (
    SELECT
      s.id,
      s.conceptual_score,
      s.outcomes_score,
      s.monitoring_score,
      s.final_score,
      s.is_synthetic
    FROM public.submissions s
    WHERE s.model_type = model_type_filter
      AND (include_synthetic OR s.is_synthetic = FALSE)
      -- Re-assessments share their parent's pillar and are duplicate opinions
      -- on the same document — exclude them from corpus stats.
      AND s.parent_assessment_id IS NULL
  ),
  totals AS (
    SELECT
      COUNT(*)::INTEGER                                                  AS corpus_n,
      COUNT(*) FILTER (WHERE is_synthetic = TRUE)::INTEGER               AS synthetic_n,
      COUNT(*) FILTER (WHERE is_synthetic = FALSE)::INTEGER              AS real_n,
      (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY conceptual_score))::NUMERIC  AS cs_median,
      (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY outcomes_score))::NUMERIC    AS oa_median,
      (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY monitoring_score))::NUMERIC  AS om_median,
      (PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY final_score))::NUMERIC       AS final_median
    FROM scoped
  ),
  -- element_code + element_name only. No description, no recommendation, no
  -- submission/user identifiers — those would leak per-row content.
  top_gaps_calc AS (
    SELECT
      COALESCE(
        JSONB_AGG(
          JSONB_BUILD_OBJECT(
            'element_code', element_code,
            'element_name', element_name,
            'frequency',    freq
          )
          ORDER BY freq DESC, element_code ASC
        ),
        '[]'::JSONB
      ) AS top_gaps
    FROM (
      SELECT
        g.element_code,
        MAX(g.element_name)        AS element_name,
        COUNT(DISTINCT g.submission_id) AS freq
      FROM public.gaps g
      JOIN scoped s ON s.id = g.submission_id
      GROUP BY g.element_code
      ORDER BY freq DESC, g.element_code ASC
      LIMIT 5
    ) ranked
  )
  SELECT
    t.corpus_n,
    t.synthetic_n,
    t.real_n,
    t.cs_median,
    t.oa_median,
    t.om_median,
    t.final_median,
    tg.top_gaps
  FROM totals t
  CROSS JOIN top_gaps_calc tg;
END;
$$;

-- Lock down execution: only authenticated users may call. PUBLIC and anon
-- never see the function — the SECURITY DEFINER wrapper would otherwise be
-- callable by anyone with a Supabase anon key.
REVOKE ALL ON FUNCTION public.get_benchmark_stats(public.model_type, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_benchmark_stats(public.model_type, BOOLEAN) TO authenticated;

-- 4. get_corpus_disclosure ----------------------------------------------------
--
-- Returns global counts (across all model_types) for the disclosure banner:
-- "Benchmark corpus: N=X (Y synthetic, Z real)". This is intentionally
-- coarser than per-model-type counts — it exists to set user expectations
-- about overall corpus maturity without revealing how many submissions any
-- single model_type bucket holds.

CREATE OR REPLACE FUNCTION public.get_corpus_disclosure()
RETURNS TABLE (
  total_n      INTEGER,
  synthetic_n  INTEGER,
  real_n       INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    COUNT(*)::INTEGER                                       AS total_n,
    COUNT(*) FILTER (WHERE is_synthetic = TRUE)::INTEGER    AS synthetic_n,
    COUNT(*) FILTER (WHERE is_synthetic = FALSE)::INTEGER   AS real_n
  FROM public.submissions
  WHERE parent_assessment_id IS NULL;
$$;

REVOKE ALL ON FUNCTION public.get_corpus_disclosure() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_corpus_disclosure() TO authenticated;
