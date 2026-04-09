import { parsePDF, PDFParseError } from "./pdf";

// pdf-parse v2 uses workers that require --experimental-vm-modules and cannot
// run natively in Jest. It is an external system boundary so mocking is correct.
jest.mock("pdf-parse/worker", () => ({
  CanvasFactory: jest.fn(),
}));

jest.mock("pdf-parse", () => ({
  PDFParse: jest.fn().mockImplementation(({ data }: { data: Buffer }) => ({
    load: jest.fn().mockResolvedValue(undefined),
    getText: jest.fn().mockImplementation(async () => {
      if (!data || data.length === 0) throw new Error("Empty PDF");
      return { text: "Extracted PDF text" };
    }),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe("parsePDF", () => {
  it("returns a string from a valid PDF buffer", async () => {
    const result = await parsePDF(Buffer.from("%PDF-1.4 fake content"));
    expect(typeof result).toBe("string");
    expect(result).toBe("Extracted PDF text");
  });

  it("does not accept a file path — only a Buffer", async () => {
    await expect(parsePDF("./some/path.pdf" as unknown as Buffer)).rejects.toThrow(
      PDFParseError
    );
  });

  it("throws a PDFParseError on library failure", async () => {
    const { PDFParse } = await import("pdf-parse");
    (PDFParse as unknown as jest.Mock).mockImplementationOnce(() => ({
      load: jest.fn().mockResolvedValue(undefined),
      getText: jest.fn().mockRejectedValue(new Error("corrupt PDF")),
      destroy: jest.fn().mockResolvedValue(undefined),
    }));

    await expect(parsePDF(Buffer.from("bad"))).rejects.toThrow(PDFParseError);
  });
});
