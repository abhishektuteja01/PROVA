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
const PARSE_TIMEOUT_MS = 15_000;

export async function parseDOCX(buffer: Buffer): Promise<string> {
  if (!Buffer.isBuffer(buffer)) {
    throw new DOCXParseError("parseDOCX requires a Buffer, not a file path");
  }

  let timeoutHandle: NodeJS.Timeout | null = null;
  try {
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new DOCXParseError(`DOCX parsing timed out after ${PARSE_TIMEOUT_MS}ms`)),
        PARSE_TIMEOUT_MS
      );
    });

    const result = await Promise.race([mammoth.extractRawText({ buffer }), timeout]);
    return result.value;
  } catch (err) {
    if (err instanceof DOCXParseError) throw err;
    throw new DOCXParseError(
      `Failed to parse DOCX: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    if (timeoutHandle !== null) clearTimeout(timeoutHandle);
  }
}
