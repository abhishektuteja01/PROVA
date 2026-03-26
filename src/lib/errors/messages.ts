/**
 * Prova error definitions — single source of truth for all error codes,
 * HTTP statuses, and user-facing messages.
 *
 * Migrated from docs/ERROR_STATES.md. If you need to add or change an error,
 * do it here — the doc file is kept only for human reference.
 */

import { NextResponse } from 'next/server';

export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'FILE_TYPE_INVALID'
  | 'FILE_TOO_LARGE'
  | 'FILE_PARSE_FAILED'
  | 'DOCUMENT_TOO_SHORT'
  | 'DOCUMENT_TOO_LONG'
  | 'AI_UNAVAILABLE'
  | 'AI_SCHEMA_INVALID'
  | 'SUBMISSION_NOT_FOUND'
  | 'REPORT_GENERATION_FAILED'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

interface ErrorDef {
  status: number;
  message: string;
}

export const ERRORS: Record<ErrorCode, ErrorDef> = {
  AUTH_REQUIRED: {
    status: 401,
    message: 'Your session has expired. Please log in again.',
  },
  AUTH_INVALID: {
    status: 401,
    message: 'Your session has expired. Please log in again.',
  },
  RATE_LIMIT_EXCEEDED: {
    status: 429,
    message: 'Assessment limit reached. Try again in {minutes} minutes.',
  },
  VALIDATION_ERROR: {
    status: 400,
    message: 'Invalid request.',
  },
  FILE_TYPE_INVALID: {
    status: 400,
    message: 'Invalid file type. Please upload a PDF or Word document (.docx).',
  },
  FILE_TOO_LARGE: {
    status: 400,
    message: 'File is too large. Maximum file size is 10MB.',
  },
  FILE_PARSE_FAILED: {
    status: 422,
    message: 'Could not read this file. Try pasting your document text directly instead.',
  },
  DOCUMENT_TOO_SHORT: {
    status: 400,
    message: 'Document is too short. Paste the complete model documentation for a meaningful assessment.',
  },
  DOCUMENT_TOO_LONG: {
    status: 400,
    message: 'Document exceeds the 50,000 character limit. Paste the core validation sections only.',
  },
  AI_UNAVAILABLE: {
    status: 503,
    message: 'Assessment service is temporarily unavailable. Please try again in a few moments.',
  },
  AI_SCHEMA_INVALID: {
    status: 500,
    message: 'Assessment could not be completed. Our team has been notified. Please try again.',
  },
  SUBMISSION_NOT_FOUND: {
    status: 404,
    message: 'Submission not found.',
  },
  REPORT_GENERATION_FAILED: {
    status: 500,
    message: 'Report could not be generated. Please try again.',
  },
  DATABASE_ERROR: {
    status: 500,
    message: 'Something went wrong saving your assessment. Please try again.',
  },
  UNKNOWN_ERROR: {
    status: 500,
    message: 'Something went wrong. Please try again.',
  },
};

/**
 * Build a standardised JSON error response.
 *
 * @param code     One of the defined ErrorCode values
 * @param options  Optional overrides — custom message or extra fields (e.g. retry_after_seconds)
 */
export function errorResponse(
  code: ErrorCode,
  options?: { message?: string; extras?: Record<string, unknown> }
) {
  const def = ERRORS[code];
  return NextResponse.json(
    {
      error: code,
      error_code: code,
      message: options?.message ?? def.message,
      ...options?.extras,
    },
    { status: def.status }
  );
}
