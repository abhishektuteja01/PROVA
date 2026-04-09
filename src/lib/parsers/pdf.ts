export class PDFParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PDFParseError";
  }
}

/**
 * Extracts text from a PDF buffer.
 * Accepts a Buffer only — never a file path (in-memory processing).
 */
const PARSE_TIMEOUT_MS = 15_000;

export async function parsePDF(buffer: Buffer): Promise<string> {
  if (!Buffer.isBuffer(buffer)) {
    throw new PDFParseError("parsePDF requires a Buffer, not a file path");
  }

  const { getDocumentProxy, extractText } = await import("unpdf");

  let timeoutHandle: NodeJS.Timeout | null = null;
  try {
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new PDFParseError(`PDF parsing timed out after ${PARSE_TIMEOUT_MS}ms`)),
        PARSE_TIMEOUT_MS
      );
    });

    const pdf = await Promise.race([
      getDocumentProxy(new Uint8Array(buffer)),
      timeout,
    ]);
    const { text } = await Promise.race([
      extractText(pdf, { mergePages: true }),
      timeout,
    ]);
    pdf.cleanup();
    return text;
  } catch (err) {
    if (err instanceof PDFParseError) throw err;
    throw new PDFParseError(
      `Failed to parse PDF: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    if (timeoutHandle !== null) clearTimeout(timeoutHandle);
  }
}
