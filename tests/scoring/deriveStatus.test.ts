/**
 * TDD REFACTOR PHASE — deriveStatus
 *
 * Converted to a table-driven format for clarity.
 * All threshold values are documented inline with the scoring formula.
 * No behaviour changes — same assertions, cleaner structure.
 *
 * Scoring formula (from docs/SCORING.md):
 *   score >= 80  → Compliant
 *   score >= 60  → Needs Improvement
 *   score <  60  → Critical Gaps
 */
import { deriveStatus } from '@/lib/scoring/calculator';
import type { Status } from '@/lib/validation/schemas';

// ─── Table-driven boundary tests ──────────────────────────────────────────────

const cases: [number, Status, string][] = [
  [100, 'Compliant',         'maximum score'],
  [80,  'Compliant',         'exact Compliant lower boundary'],
  [79,  'Needs Improvement', 'one below Compliant threshold'],
  [60,  'Needs Improvement', 'exact Needs Improvement lower boundary'],
  [59,  'Critical Gaps',     'one below Needs Improvement threshold'],
  [0,   'Critical Gaps',     'minimum score'],
];

describe('deriveStatus', () => {
  test.each(cases)(
    'score %i → "%s" (%s)',
    (score, expected) => {
      expect(deriveStatus(score)).toBe(expected);
    },
  );
});
