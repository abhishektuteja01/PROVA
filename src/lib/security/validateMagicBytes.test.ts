/**
 * TDD RED PHASE — validateFileMagicBytes
 *
 * These tests are written before verifying expected values.
 * All assertions are intentionally wrong so the suite fails.
 * Commit this file as-is to record the red phase.
 */
import { validateFileMagicBytes } from './sanitize';

function makePdfBuffer(): Buffer {
  // Real PDF magic bytes: %PDF-  (0x25 0x50 0x44 0x46 0x2D)
  return Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x00, 0x00]);
}

function makeDocxBuffer(): Buffer {
  // Real DOCX magic bytes: PK\x03\x04  (ZIP archive header)
  return Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
}

function makeRandomBuffer(): Buffer {
  return Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);
}

describe('validateFileMagicBytes — RED phase (wrong assertions)', () => {
  it('should return FALSE for a valid PDF buffer checked as pdf (WRONG: will be fixed in green)', () => {
    // Wrong: a real PDF buffer SHOULD return true, not false
    expect(validateFileMagicBytes(makePdfBuffer(), 'pdf')).toBe(false);
  });

  it('should return FALSE for a valid DOCX buffer checked as docx (WRONG: will be fixed in green)', () => {
    // Wrong: a real DOCX buffer SHOULD return true, not false
    expect(validateFileMagicBytes(makeDocxBuffer(), 'docx')).toBe(false);
  });

  it('should return TRUE for a random buffer checked as pdf (WRONG: will be fixed in green)', () => {
    // Wrong: a random buffer SHOULD return false, not true
    expect(validateFileMagicBytes(makeRandomBuffer(), 'pdf')).toBe(true);
  });

  it('should return TRUE for a PDF buffer checked as docx (WRONG: will be fixed in green)', () => {
    // Wrong: a PDF buffer checked as docx SHOULD return false, not true
    expect(validateFileMagicBytes(makePdfBuffer(), 'docx')).toBe(true);
  });

  it('should return TRUE for an empty buffer checked as pdf (WRONG: empty buffer has no magic bytes)', () => {
    // Wrong: an empty buffer can't match any magic bytes — should be false
    expect(validateFileMagicBytes(Buffer.alloc(0), 'pdf')).toBe(true);
  });
});
