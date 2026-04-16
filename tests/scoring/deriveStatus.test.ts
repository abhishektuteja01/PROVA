/**
 * TDD RED PHASE — deriveStatus
 *
 * Tests are written with deliberately wrong assertions so the suite fails.
 * Commit this file as-is to record the red phase.
 */
import { deriveStatus } from '@/lib/scoring/calculator';

describe('deriveStatus — RED phase (wrong assertions)', () => {
  it('should return "Needs Improvement" for score 100 (WRONG: should be Compliant)', () => {
    expect(deriveStatus(100)).toBe('Needs Improvement');
  });

  it('should return "Needs Improvement" for score 80 (WRONG: 80 is the Compliant threshold)', () => {
    expect(deriveStatus(80)).toBe('Needs Improvement');
  });

  it('should return "Compliant" for score 79 (WRONG: 79 is below the threshold)', () => {
    expect(deriveStatus(79)).toBe('Compliant');
  });

  it('should return "Critical Gaps" for score 60 (WRONG: 60 is Needs Improvement)', () => {
    expect(deriveStatus(60)).toBe('Critical Gaps');
  });

  it('should return "Compliant" for score 59 (WRONG: 59 is Critical Gaps)', () => {
    expect(deriveStatus(59)).toBe('Compliant');
  });

  it('should return "Needs Improvement" for score 0 (WRONG: 0 is Critical Gaps)', () => {
    expect(deriveStatus(0)).toBe('Needs Improvement');
  });
});
