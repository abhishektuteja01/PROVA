# Prova — Error States
**Version:** 1.0 | **Date:** March 19, 2026

<!-- SUMMARY: 16 error codes. Quick reference table (code, HTTP status, trigger): §1.
Full detail per error (trigger, message, UI behavior, recovery): §2.
Toast specs: §3 | API response format: §4 | errorResponse() pattern: §5 -->

Every error in Prova has a defined code, user-facing message, UI behavior, and recovery action.
Implement all error states exactly as defined here — do not invent error messages inline.

---

## Error Code Reference

| Code | HTTP Status | Trigger |
|------|-------------|---------|
| `AUTH_REQUIRED` | 401 | Unauthenticated request to protected route |
| `AUTH_INVALID` | 401 | Invalid or expired session token |
| `RATE_LIMIT_EXCEEDED` | 429 | User exceeded compliance check limit |
| `VALIDATION_ERROR` | 400 | Request body fails Zod schema validation |
| `FILE_TYPE_INVALID` | 400 | Uploaded file is not PDF or DOCX |
| `FILE_TOO_LARGE` | 400 | Uploaded file exceeds 10MB |
| `FILE_PARSE_FAILED` | 422 | Could not extract text from file |
| `DOCUMENT_TOO_SHORT` | 400 | Extracted/submitted text under 100 characters |
| `DOCUMENT_TOO_LONG` | 400 | Text exceeds 50,000 characters |
| `AI_UNAVAILABLE` | 503 | Anthropic API call failed |
| `AI_SCHEMA_INVALID` | 500 | Agent returned malformed JSON after max retries |
| `ASSESSMENT_LOW_CONFIDENCE` | 200 | Check succeeded but judge confidence < 0.6 after retries |
| `SUBMISSION_NOT_FOUND` | 404 | Submission ID does not exist or belongs to another user |
| `REPORT_GENERATION_FAILED` | 500 | React-PDF failed to generate report |
| `DATABASE_ERROR` | 500 | Supabase write/read failed |
| `UNKNOWN_ERROR` | 500 | Unexpected error not matching above codes |

---

## Detailed Error State Definitions

### AUTH_REQUIRED
**Trigger:** User accesses `/dashboard`, `/check`, `/submissions`, `/settings`, `/help` without a valid session.
**HTTP:** 401
**User-facing message:** Not shown — middleware redirects to `/login` before any UI renders.
**UI behavior:** Silent redirect to `/login`. After login, redirect back to originally requested URL.
**Recovery:** Log in.

---

### AUTH_INVALID
**Trigger:** Session token exists but is expired or invalid when verified server-side in an API route.
**HTTP:** 401
**API response:**
```json
{
  "error": "AUTH_INVALID",
  "error_code": "AUTH_INVALID",
  "message": "Your session has expired. Please log in again."
}
```
**User-facing message:** "Your session has expired. Please log in again."
**UI behavior:** Toast notification (amber). Redirect to `/login` after 2 seconds.
**Recovery:** Log in again.

---

### RATE_LIMIT_EXCEEDED
**Trigger:** User has exceeded `RATE_LIMIT_REQUESTS_PER_HOUR` compliance checks in the current hour.
**HTTP:** 429
**API response:**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "message": "You have reached the assessment limit. Try again in 23 minutes.",
  "retry_after_seconds": 1380
}
```
**User-facing message:** "Assessment limit reached. Try again in [X] minutes."
**UI behavior:** Inline error below submit button. Submit button disabled. Countdown timer shown.
**Recovery:** Wait for rate limit window to reset.

---

### VALIDATION_ERROR
**Trigger:** Request body fails Zod schema validation (e.g., model name too long, invalid characters).
**HTTP:** 400
**API response:**
```json
{
  "error": "VALIDATION_ERROR",
  "error_code": "VALIDATION_ERROR",
  "message": "Model name contains invalid characters. Use letters, numbers, spaces, hyphens, underscores, and parentheses only."
}
```
**User-facing message:** Show the specific validation message from the response.
**UI behavior:** Inline error below the relevant input field. Field highlighted with red border.
**Recovery:** Fix the input and resubmit.

---

### FILE_TYPE_INVALID
**Trigger:** User uploads a file that is not PDF or DOCX (checked by extension AND MIME type server-side).
**HTTP:** 400
**User-facing message:** "Invalid file type. Please upload a PDF or Word document (.docx)."
**UI behavior:** Inline error in file upload zone. File rejected, upload zone returns to default state.
**Recovery:** Upload a valid PDF or DOCX file, or switch to text input.

---

### FILE_TOO_LARGE
**Trigger:** Uploaded file exceeds 10MB.
**HTTP:** 400
**User-facing message:** "File is too large. Maximum file size is 10MB."
**UI behavior:** Inline error in file upload zone.
**Recovery:** Compress the file or switch to text input by pasting the content.

---

### FILE_PARSE_FAILED
**Trigger:** `unpdf` or `mammoth` fails to extract text from a valid file type.
**HTTP:** 422
**User-facing message:** "Could not read this file. Try pasting your document text directly instead."
**UI behavior:** Inline error. "Switch to text input" button shown prominently as recovery action.
**Recovery:** Switch to text input tab and paste document content manually.

---

### DOCUMENT_TOO_SHORT
**Trigger:** Text (from input or file extraction) is under 100 characters.
**HTTP:** 400
**User-facing message:** "Document is too short. Paste the complete model documentation for a meaningful assessment."
**UI behavior:** Inline error below text area. Character count shown in red.
**Recovery:** Paste complete document content.

---

### DOCUMENT_TOO_LONG
**Trigger:** Text exceeds 50,000 characters (~35-40 pages).
**HTTP:** 400
**User-facing message:** "Document exceeds the 50,000 character limit. Paste the core validation sections only."
**UI behavior:** Inline error. Character count shown in red with over-limit count highlighted.
**Recovery:** Trim document to core SR 11-7 sections.

---

### AI_UNAVAILABLE
**Trigger:** Anthropic API returns a non-200 response or times out.
**HTTP:** 503
**User-facing message:** "Assessment service is temporarily unavailable. Please try again in a few moments."
**UI behavior:** Full-page error state on `/check` page with "Try Again" button. Toast notification also shown.
**Recovery:** Click "Try Again" — document input is preserved (not cleared).
**Note:** Log to Sentry with full error details.

---

### AI_SCHEMA_INVALID
**Trigger:** Agent returns JSON that fails Zod schema validation AND max retries (2) are exhausted.
**HTTP:** 500
**User-facing message:** "Assessment could not be completed. Our team has been notified. Please try again."
**UI behavior:** Full error state. "Try Again" button. Document input preserved.
**Recovery:** Retry. If persistent, report the issue.
**Note:** This should be rare. Log to Sentry with agent output for debugging.

---

### SUBMISSION_NOT_FOUND
**Trigger:** `GET /api/submissions/[id]` or `POST /api/report` with an ID that doesn't exist or belongs to another user (RLS prevents access to others' data — appears as "not found").
**HTTP:** 404
**User-facing message:** "Submission not found."
**UI behavior:** Full 404 page with link back to `/submissions`.
**Recovery:** Return to submissions list.

---

### REPORT_GENERATION_FAILED
**Trigger:** React-PDF throws an error during PDF rendering.
**HTTP:** 500
**User-facing message:** "Report could not be generated. Please try again."
**UI behavior:** Toast error notification. "Download Report" button returns to enabled state.
**Recovery:** Try downloading again. Log to Sentry.

---

### DATABASE_ERROR
**Trigger:** Supabase returns an error on read or write.
**HTTP:** 500
**User-facing message:** "Something went wrong saving your assessment. Please try again."
**UI behavior:** Toast error. Do not clear document input.
**Recovery:** Retry. Log to Sentry with Supabase error details.

---

### UNKNOWN_ERROR
**Trigger:** Any error not matching the above codes.
**HTTP:** 500
**User-facing message:** "Something went wrong. Please try again."
**UI behavior:** Toast error.
**Recovery:** Retry. Always log to Sentry.

---

## Toast Notification Behavior

| Type | Color | Duration | Dismissible |
|------|-------|----------|-------------|
| Success | Green | 4 seconds | Yes |
| Warning | Amber | 6 seconds | Yes |
| Error | Red | 8 seconds | Yes |

---

## API Error Response Format

All API errors return this structure (defined in `ErrorResponseSchema` in `/docs/SCHEMAS.md`):

```typescript
{
  error: string,           // Human-readable error type
  error_code: string,      // Machine-readable code from this document
  message: string,         // User-facing message
  retry_after_seconds?: number  // Only included for RATE_LIMIT_EXCEEDED
}
```

---

## Implementation Pattern

In every API route, use this error handler pattern:

```typescript
// /src/app/api/compliance/route.ts

import { NextResponse } from 'next/server';

function errorResponse(
  error_code: string,
  message: string,
  status: number,
  extras?: object
) {
  return NextResponse.json(
    { error: error_code, error_code, message, ...extras },
    { status }
  );
}

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return errorResponse('AUTH_INVALID', 'Your session has expired. Please log in again.', 401);
  }

  // Rate limit check
  const isRateLimited = await checkRateLimit(user.id);
  if (isRateLimited.exceeded) {
    return errorResponse(
      'RATE_LIMIT_EXCEEDED',
      `Assessment limit reached. Try again in ${Math.ceil(isRateLimited.retryAfter / 60)} minutes.`,
      429,
      { retry_after_seconds: isRateLimited.retryAfter }
    );
  }

  // ... rest of handler
}
```

---

*Prova Error States v1.0 | March 2026*
