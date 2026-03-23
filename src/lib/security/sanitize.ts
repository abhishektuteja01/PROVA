import { ALLOWED_EXTENSIONS } from "@/lib/validation/schemas";

/**
 * Strips HTML tags, script-like patterns, and normalizes whitespace.
 * Does NOT truncate — length limits are enforced at the Zod schema layer.
 */
export function sanitizeText(raw: string): string {
  let text = raw;

  // Strip null bytes first — they can split keyword patterns to defeat regex filters
  text = text.replace(/\x00/g, "");

  // Strip <script>...</script> blocks including their content
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");

  // Strip dangerous URI schemes
  text = text.replace(/javascript\s*:/gi, "");
  text = text.replace(/vbscript\s*:/gi, "");
  text = text.replace(/data\s*:/gi, "");

  // Strip event handler attributes (onerror=, onclick=, etc.)
  text = text.replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, "");
  text = text.replace(/on\w+\s*=\s*[^\s>]*/gi, "");

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // Normalize whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\r\n|\r/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

const EXTENSION_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * Validates that BOTH the file extension AND MIME type are accepted,
 * and that they correspond to the same format.
 * Never trusts client-supplied MIME type alone.
 */
export function validateFileType(filename: string, mimeType: string): boolean {
  const lowerName = filename.toLowerCase();
  const matchedExt = (ALLOWED_EXTENSIONS as readonly string[]).find((ext) =>
    lowerName.endsWith(ext)
  );
  if (!matchedExt) return false;
  return EXTENSION_TO_MIME[matchedExt] === mimeType;
}
