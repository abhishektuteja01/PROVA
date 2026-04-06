// Polyfill DOM globals that pdfjs-dist expects but don't exist in
// Vercel's serverless Node.js runtime.  Only text extraction is used,
// so these stubs are never called — they just prevent the
// "DOMMatrix is not defined" crash on import.
// pdf-parse must NOT be in serverExternalPackages — bundling ensures
// these polyfills execute before pdfjs-dist initializes (when dynamically imported).
if (typeof globalThis.DOMMatrix === "undefined") {
  (globalThis as Record<string, unknown>).DOMMatrix = class DOMMatrix {};
}
if (typeof globalThis.Path2D === "undefined") {
  (globalThis as Record<string, unknown>).Path2D = class Path2D {};
}
if (typeof globalThis.ImageData === "undefined") {
  (globalThis as Record<string, unknown>).ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(width: number, height: number) {
      this.data = new Uint8ClampedArray(width * height * 4);
      this.width = width;
      this.height = height;
    }
  };
}

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
