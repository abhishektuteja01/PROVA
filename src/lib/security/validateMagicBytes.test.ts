/**
 * TDD GREEN PHASE — validateFileMagicBytes
 *
 * Assertions corrected to match the real behaviour of validateFileMagicBytes.
 * All tests now pass without any changes to the source implementation.
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

describe('validateFileMagicBytes', () => {
  it('returns true for a valid PDF buffer checked as pdf', () => {
    expect(validateFileMagicBytes(makePdfBuffer(), 'pdf')).toBe(true);
  });

  it('returns true for a valid DOCX buffer checked as docx', () => {
    expect(validateFileMagicBytes(makeDocxBuffer(), 'docx')).toBe(true);
  });

  it('returns false for a random buffer checked as pdf', () => {
    expect(validateFileMagicBytes(makeRandomBuffer(), 'pdf')).toBe(false);
  });

  it('returns false for a PDF buffer checked as docx (magic bytes do not match)', () => {
    expect(validateFileMagicBytes(makePdfBuffer(), 'docx')).toBe(false);
  });

  it('returns false for an empty buffer (too short to contain any magic bytes)', () => {
    expect(validateFileMagicBytes(Buffer.alloc(0), 'pdf')).toBe(false);
  });
});
