-- Scoped re-assessment + dispute trail.
--
-- - `submissions.parent_assessment_id` links a re-run submission row to its
--   immutable origin. NULL for original submissions.
-- - `dispute_events` records every reviewer-filed disagreement that triggered a
--   re-run. Rows are append-only — no UPDATE/DELETE policies. The trail is the
--   labeled-disagreement dataset, so it must survive even if a downstream
--   re-assessment is deleted; on submission delete we SET NULL on assessment_id
--   so the rationale is preserved.

-- 1. Add parent_assessment_id to submissions ----------------------------------

ALTER TABLE public.submissions
  ADD COLUMN parent_assessment_id UUID
    REFERENCES public.submissions(id) ON DELETE SET NULL;

ALTER TABLE public.submissions
  ADD COLUMN low_confidence_manual_review BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_submissions_parent_assessment_id
  ON public.submissions(parent_assessment_id)
  WHERE parent_assessment_id IS NOT NULL;

-- The (model_id, version_number) uniqueness should only apply to original
-- submissions. Re-assessments share their parent's version_number — they are
-- not new versions, they are additional opinions on an existing version.
ALTER TABLE public.submissions
  DROP CONSTRAINT submissions_model_version_unique;

CREATE UNIQUE INDEX submissions_model_version_unique
  ON public.submissions(model_id, version_number)
  WHERE parent_assessment_id IS NULL;

-- 2. Create dispute_events ----------------------------------------------------

CREATE TABLE public.dispute_events (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id        UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  gap_id               UUID REFERENCES public.gaps(id)        ON DELETE SET NULL,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dispute_type         TEXT NOT NULL CHECK (
                         dispute_type IN ('false_positive', 'wrong_severity', 'missing_context')
                       ),
  reviewer_rationale   TEXT NOT NULL CHECK (
                         char_length(trim(reviewer_rationale)) >= 10
                         AND char_length(reviewer_rationale) <= 2000
                       ),
  proposed_resolution  TEXT CHECK (
                         proposed_resolution IS NULL
                         OR char_length(proposed_resolution) <= 2000
                       ),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dispute_events_assessment_id ON public.dispute_events(assessment_id);
CREATE INDEX idx_dispute_events_user_id       ON public.dispute_events(user_id);
CREATE INDEX idx_dispute_events_gap_id        ON public.dispute_events(gap_id);

-- 3. Row Level Security -------------------------------------------------------

ALTER TABLE public.dispute_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dispute_events_select_own"
  ON public.dispute_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dispute_events_insert_own"
  ON public.dispute_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE policy: dispute records are immutable evidence.
-- No DELETE policy: trail must survive even when associated submissions are removed.
