import { sanitizeText, validateFileType } from "./sanitize";

describe("sanitizeText", () => {
  it("strips plain HTML tags", () => {
    expect(sanitizeText("<p>Hello world</p>")).toBe("Hello world");
  });

  it("strips <script> blocks including content", () => {
    expect(sanitizeText('Before<script>alert("xss")</script>After')).toBe(
      "BeforeAfter"
    );
  });

  it("strips inline javascript: patterns", () => {
    expect(sanitizeText("click javascript:alert(1) here")).toBe(
      "click alert(1) here"
    );
  });

  it("strips inline vbscript: patterns", () => {
    expect(sanitizeText("vbscript:MsgBox(1)")).not.toMatch(/vbscript:/i);
  });

  it("strips data: URI patterns", () => {
    expect(sanitizeText("data:text/html,<b>hi</b>")).not.toMatch(/data:/i);
  });

  it("strips null bytes that can bypass script-tag detection", () => {
    // <scr\x00ipt> should not leave its contents behind
    const result = sanitizeText("<scr\x00ipt>alert(1)</scr\x00ipt>");
    expect(result).not.toContain("alert(1)");
  });

  it("strips onerror= and other event handler attributes", () => {
    expect(sanitizeText('<img src="x" onerror="alert(1)">')).toBe("");
  });

  it("preserves normal plain text prose", () => {
    const prose =
      "The model uses Black-Scholes for option pricing. Assumptions include constant volatility.";
    expect(sanitizeText(prose)).toBe(prose);
  });

  it("preserves numbers and punctuation in prose", () => {
    const text = "Score: 95.4%, Date: 2024-01-01, Ratio: 1/3";
    expect(sanitizeText(text)).toBe(text);
  });

  it("normalizes multiple spaces to single space", () => {
    expect(sanitizeText("hello   world")).toBe("hello world");
  });

  it("normalizes multiple blank lines to at most two newlines", () => {
    const result = sanitizeText("line1\n\n\n\nline2");
    expect(result).toBe("line1\n\nline2");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeText("   hello   ")).toBe("hello");
  });
});

describe("validateFileType", () => {
  it("accepts .pdf with application/pdf", () => {
    expect(validateFileType("model_doc.pdf", "application/pdf")).toBe(true);
  });

  it("accepts .docx with correct MIME type", () => {
    expect(
      validateFileType(
        "model_doc.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe(true);
  });

  it("rejects .exe with PDF MIME type", () => {
    expect(validateFileType("malware.exe", "application/pdf")).toBe(false);
  });

  it("rejects .pdf with wrong MIME type", () => {
    expect(validateFileType("doc.pdf", "text/plain")).toBe(false);
  });

  it("rejects .docx with wrong MIME type", () => {
    expect(validateFileType("doc.docx", "application/pdf")).toBe(false);
  });

  it("rejects .txt extension regardless of MIME type", () => {
    expect(validateFileType("doc.txt", "application/pdf")).toBe(false);
  });

  it("is case-insensitive on filename extension", () => {
    expect(validateFileType("MODEL.PDF", "application/pdf")).toBe(true);
  });
});
