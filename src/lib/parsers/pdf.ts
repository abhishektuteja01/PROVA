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
export async function parsePDF(buffer: Buffer): Promise<string> {
  if (!Buffer.isBuffer(buffer)) {
    throw new PDFParseError("parsePDF requires a Buffer, not a file path");
  }

  // Dynamic import ensures polyfills run before pdf-parse and pdfjs-dist are evaluated
  const { PDFParse } = await import("pdf-parse");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parser: any;
  try {
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  } catch (err) {
    throw new PDFParseError(
      `Failed to parse PDF: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    if (parser?.destroy) {
      await parser.destroy();
    }
  }
}
