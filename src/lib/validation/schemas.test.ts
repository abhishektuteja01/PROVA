import { loginSchema, signupSchema, documentUploadSchema } from "./schemas";

// ─── loginSchema ──────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "user@bank.com", password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ email: "", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed email", () => {
    const result = loginSchema.safeParse({ email: "notanemail", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = loginSchema.safeParse({ email: "user@bank.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({ email: "user@bank.com", password: "" });
    expect(result.success).toBe(false);
  });
});

// ─── signupSchema ─────────────────────────────────────────────────────────────

describe("signupSchema", () => {
  it("accepts valid email, password, and matching confirmPassword", () => {
    const result = signupSchema.safeParse({
      email: "user@bank.com",
      password: "secret123",
      confirmPassword: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when passwords do not match", () => {
    const result = signupSchema.safeParse({
      email: "user@bank.com",
      password: "secret123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      email: "user@bank.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed email", () => {
    const result = signupSchema.safeParse({
      email: "notanemail",
      password: "secret123",
      confirmPassword: "secret123",
    });
    expect(result.success).toBe(false);
  });
});

// ─── documentUploadSchema ─────────────────────────────────────────────────────

describe("documentUploadSchema", () => {
  it("accepts a pdf file within size limit", () => {
    const result = documentUploadSchema.safeParse({
      name: "model-doc.pdf",
      type: "application/pdf",
      size: 1024 * 1024, // 1 MB
    });
    expect(result.success).toBe(true);
  });

  it("accepts a docx file within size limit", () => {
    const result = documentUploadSchema.safeParse({
      name: "model-doc.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 2 * 1024 * 1024, // 2 MB
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unsupported file type", () => {
    const result = documentUploadSchema.safeParse({
      name: "malware.exe",
      type: "application/octet-stream",
      size: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a file exceeding 10 MB", () => {
    const result = documentUploadSchema.safeParse({
      name: "huge.pdf",
      type: "application/pdf",
      size: 11 * 1024 * 1024, // 11 MB
    });
    expect(result.success).toBe(false);
  });

  it("rejects a file with zero size", () => {
    const result = documentUploadSchema.safeParse({
      name: "empty.pdf",
      type: "application/pdf",
      size: 0,
    });
    expect(result.success).toBe(false);
  });
});
