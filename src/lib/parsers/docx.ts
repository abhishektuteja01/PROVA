import mammoth from "mammoth";

export class DOCXParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DOCXParseError";
  }
}

/**
 * Extracts plain text from a DOCX buffer.
 * Accepts a Buffer only — never a file path (in-memory processing).
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
  if (!Buffer.isBuffer(buffer)) {
    throw new DOCXParseError("parseDOCX requires a Buffer, not a file path");
  }

  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (err) {
    throw new DOCXParseError(
      `Failed to parse DOCX: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
