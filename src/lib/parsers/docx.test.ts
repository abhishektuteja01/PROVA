import { parseDOCX, DOCXParseError } from "./docx";
import JSZip from "jszip";

/**
 * Build a minimal valid DOCX buffer in memory.
 * A DOCX is a ZIP containing at minimum:
 *   [Content_Types].xml, word/document.xml, word/_rels/document.xml.rels, _rels/.rels
 */
async function buildMinimalDocx(text: string): Promise<Buffer> {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>`
  );

  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`
  );

  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>${text}</w:t></w:r></w:p>
  </w:body>
</w:document>`
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return buffer;
}

describe("parseDOCX", () => {
  it("returns a string containing the document text", async () => {
    const buf = await buildMinimalDocx("Hello DOCX");
    const result = await parseDOCX(buf);
    expect(typeof result).toBe("string");
    expect(result).toContain("Hello DOCX");
  });

  it("does not accept a file path — only a Buffer", async () => {
    await expect(
      parseDOCX("./some/path.docx" as unknown as Buffer)
    ).rejects.toThrow(DOCXParseError);
  });

  it("throws a DOCXParseError on invalid buffer", async () => {
    const bad = Buffer.from("not a docx");
    await expect(parseDOCX(bad)).rejects.toThrow(DOCXParseError);
  });
});
