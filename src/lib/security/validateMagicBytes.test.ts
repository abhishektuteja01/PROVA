/**
 * TDD REFACTOR PHASE — validateFileMagicBytes
 *
 * Extracted buffer factories into named helpers and added two extra
 * edge-case tests for a truncated DOCX buffer and a DOCX checked as PDF.
 * No behaviour changes — all existing assertions remain identical.
 */
import { validateFileMagicBytes } from './sanitize';

// ─── Buffer factories ──────────────────────────────────────────────────────────

/** Real PDF header: %PDF- (5 bytes) followed by padding. */
const PDF_BUFFER = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x00, 0x00]);

/** Real DOCX header: PK\x03\x04 (4 bytes, ZIP archive) followed by padding. */
const DOCX_BUFFER = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);

/** Random bytes that match neither PDF nor DOCX signatures. */
const RANDOM_BUFFER = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);

/** Only 2 bytes — too short for any supported magic-byte signature. */
const TRUNCATED_BUFFER = Buffer.from([0x25, 0x50]);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('validateFileMagicBytes', () => {
  it('returns true for a valid PDF buffer checked as pdf', () => {
    expect(validateFileMagicBytes(PDF_BUFFER, 'pdf')).toBe(true);
  });

  it('returns true for a valid DOCX buffer checked as docx', () => {
    expect(validateFileMagicBytes(DOCX_BUFFER, 'docx')).toBe(true);
  });

  it('returns false for a random buffer checked as pdf', () => {
    expect(validateFileMagicBytes(RANDOM_BUFFER, 'pdf')).toBe(false);
  });

  it('returns false for a PDF buffer checked as docx (type mismatch)', () => {
    expect(validateFileMagicBytes(PDF_BUFFER, 'docx')).toBe(false);
  });

  it('returns false for a DOCX buffer checked as pdf (type mismatch)', () => {
    expect(validateFileMagicBytes(DOCX_BUFFER, 'pdf')).toBe(false);
  });

  it('returns false for an empty buffer', () => {
    expect(validateFileMagicBytes(Buffer.alloc(0), 'pdf')).toBe(false);
  });

  it('returns false for a truncated buffer shorter than the magic-byte sequence', () => {
    expect(validateFileMagicBytes(TRUNCATED_BUFFER, 'pdf')).toBe(false);
  });
});
