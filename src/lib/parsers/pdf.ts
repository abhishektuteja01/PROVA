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

  // Dynamic import ensures polyfills run before pdf-parse and pdfjs-dist are evaluated
  const { PDFParse } = await import("pdf-parse");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parser: any;
  let timeoutHandle: NodeJS.Timeout | null = null;
  try {
    parser = new PDFParse({ data: buffer });

    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new PDFParseError(`PDF parsing timed out after ${PARSE_TIMEOUT_MS}ms`)),
        PARSE_TIMEOUT_MS
      );
    });

    const result = await Promise.race([parser.getText(), timeout]);
    return result.text;
  } catch (err) {
    if (err instanceof PDFParseError) throw err;
    throw new PDFParseError(
      `Failed to parse PDF: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    if (timeoutHandle !== null) clearTimeout(timeoutHandle);
    if (parser?.destroy) {
      try {
        await parser.destroy();
      } catch {
        // Cleanup failure must not mask the original error
      }
    }
  }
}
