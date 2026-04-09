import { parsePDF, PDFParseError } from "./pdf";

// unpdf is an external system boundary so mocking is correct.
const mockCleanup = jest.fn();
const mockGetDocumentProxy = jest.fn();
const mockExtractText = jest.fn();

jest.mock("unpdf", () => ({
  getDocumentProxy: (...args: unknown[]) => mockGetDocumentProxy(...args),
  extractText: (...args: unknown[]) => mockExtractText(...args),
}));

beforeEach(() => {
  mockCleanup.mockReset();
  mockGetDocumentProxy.mockReset().mockResolvedValue({ cleanup: mockCleanup });
  mockExtractText.mockReset().mockResolvedValue({ text: "Extracted PDF text" });
});

describe("parsePDF", () => {
  it("returns a string from a valid PDF buffer", async () => {
    const result = await parsePDF(Buffer.from("%PDF-1.4 fake content"));
    expect(typeof result).toBe("string");
    expect(result).toBe("Extracted PDF text");
    expect(mockGetDocumentProxy).toHaveBeenCalledWith(expect.any(Uint8Array));
    expect(mockCleanup).toHaveBeenCalled();
  });

  it("does not accept a file path — only a Buffer", async () => {
    await expect(parsePDF("./some/path.pdf" as unknown as Buffer)).rejects.toThrow(
      PDFParseError
    );
  });

  it("throws a PDFParseError on library failure", async () => {
    mockGetDocumentProxy.mockRejectedValueOnce(new Error("corrupt PDF"));

    await expect(parsePDF(Buffer.from("bad"))).rejects.toThrow(PDFParseError);
  });
});
