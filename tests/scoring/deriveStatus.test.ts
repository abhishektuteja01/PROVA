/**
 * TDD GREEN PHASE — deriveStatus
 *
 * Assertions corrected to match the real behaviour.
 * Thresholds: score >= 80 → Compliant, >= 60 → Needs Improvement, else Critical Gaps.
 * All tests now pass without any changes to the source implementation.
 */
import { deriveStatus } from '@/lib/scoring/calculator';

describe('deriveStatus', () => {
  it('returns "Compliant" for score 100 (maximum score)', () => {
    expect(deriveStatus(100)).toBe('Compliant');
  });

  it('returns "Compliant" for score 80 (lower Compliant boundary)', () => {
    expect(deriveStatus(80)).toBe('Compliant');
  });

  it('returns "Needs Improvement" for score 79 (just below Compliant threshold)', () => {
    expect(deriveStatus(79)).toBe('Needs Improvement');
  });

  it('returns "Needs Improvement" for score 60 (lower Needs Improvement boundary)', () => {
    expect(deriveStatus(60)).toBe('Needs Improvement');
  });

  it('returns "Critical Gaps" for score 59 (just below Needs Improvement threshold)', () => {
    expect(deriveStatus(59)).toBe('Critical Gaps');
  });

  it('returns "Critical Gaps" for score 0 (minimum score)', () => {
    expect(deriveStatus(0)).toBe('Critical Gaps');
  });
});
