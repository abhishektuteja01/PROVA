import { NextResponse } from 'next/server';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { sanitizeText, validateFileType } from '@/lib/security/sanitize';
import { parsePDF, PDFParseError } from '@/lib/parsers/pdf';
import { parseDOCX, DOCXParseError } from '@/lib/parsers/docx';
import {
  assessConceptualSoundness,
  AgentParseError,
  AgentSchemaError,
} from '@/lib/agents/conceptualSoundness';
import { ComplianceRequestSchema, MAX_FILE_SIZE_BYTES } from '@/lib/validation/schemas';
import type { Gap } from '@/lib/validation/schemas';

function errorResponse(
  error_code: string,
  message: string,
  status: number,
  extras?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: error_code, message, ...extras },
    { status }
  );
}

function deriveStatus(score: number): 'Compliant' | 'Needs Improvement' | 'Critical Gaps' {
  const rounded = Math.round(score);
  if (rounded >= 80) return 'Compliant';
  if (rounded >= 60) return 'Needs Improvement';
  return 'Critical Gaps';
}

export async function POST(request: Request) {
  // 1. Verify session server-side — nothing executes before this check
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(
      'AUTH_INVALID',
      'Your session has expired. Please log in again.',
      401
    );
  }

  const userId = user.id;

  // 2. Check rate limit before any Claude API call
  const rateLimit = await checkRateLimit(userId);
  if (!rateLimit.allowed) {
    const resetAt = rateLimit.resetAt!;
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((resetAt.getTime() - Date.now()) / 1000)
    );
    const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
    return errorResponse(
      'RATE_LIMIT_EXCEEDED',
      `Assessment limit reached. Try again in ${retryAfterMinutes} minutes.`,
      429,
      { retry_after_seconds: retryAfterSeconds }
    );
  }

  // 3. Parse request body
  let documentText: string;
  let modelName: string;

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    // File upload path
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse('INVALID_REQUEST', 'Could not parse form data.', 400);
    }

    // Validate model_name field
    const rawModelName = formData.get('model_name');
    if (typeof rawModelName !== 'string' || rawModelName.trim() === '') {
      return errorResponse('INVALID_REQUEST', 'Model name is required.', 400);
    }
    const nameResult = ComplianceRequestSchema.pick({ model_name: true }).safeParse({
      model_name: rawModelName,
    });
    if (!nameResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        nameResult.error.issues[0]?.message ?? 'Invalid model name.',
        400
      );
    }
    modelName = nameResult.data.model_name;

    // Validate file presence
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return errorResponse('INVALID_REQUEST', 'A file is required.', 400);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse(
        'FILE_TOO_LARGE',
        'File is too large. Maximum file size is 10MB.',
        400
      );
    }

    // Validate file type (extension + MIME type)
    if (!validateFileType(file.name, file.type)) {
      return errorResponse(
        'FILE_TYPE_INVALID',
        'Invalid file type. Please upload a PDF or Word document (.docx).',
        400
      );
    }

    // Parse file — buffer only, never disk
    const buffer = Buffer.from(await file.arrayBuffer());
    const lowerName = file.name.toLowerCase();

    try {
      if (lowerName.endsWith('.pdf')) {
        documentText = await parsePDF(buffer);
      } else {
        documentText = await parseDOCX(buffer);
      }
    } catch {
      return errorResponse(
        'FILE_PARSE_FAILED',
        'Could not read this file. Try pasting your document text directly instead.',
        422
      );
    }
  } else {
    // JSON text paste path
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
    }

    const result = ComplianceRequestSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.issues[0]?.message ?? 'Invalid request.',
        400,
        { details: result.error.flatten() }
      );
    }

    if (!result.data.document_text) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Document text is required.',
        400
      );
    }

    modelName = result.data.model_name;
    documentText = result.data.document_text;
  }

  // 4. Sanitize text before storage and before agent call
  const sanitizedText = sanitizeText(documentText);

  // Validate length after sanitization (file extraction may yield short/long text)
  if (sanitizedText.length < 100) {
    return errorResponse(
      'DOCUMENT_TOO_SHORT',
      'Document is too short. Paste the complete model documentation for a meaningful assessment.',
      400
    );
  }
  if (sanitizedText.length > 50000) {
    return errorResponse(
      'DOCUMENT_TOO_LONG',
      'Document exceeds the 50,000 character limit. Paste the core validation sections only.',
      400
    );
  }

  // 5. Run Conceptual Soundness agent (Sprint 1 — single agent)
  // Document wrapped in <document> tags inside assessConceptualSoundness
  let csOutput: Awaited<ReturnType<typeof assessConceptualSoundness>>;
  try {
    csOutput = await assessConceptualSoundness(sanitizedText, modelName);
  } catch (err) {
    if (err instanceof AgentParseError || err instanceof AgentSchemaError) {
      return errorResponse(
        'AI_SCHEMA_INVALID',
        'Assessment could not be completed. Our team has been notified. Please try again.',
        500
      );
    }
    return errorResponse(
      'AI_UNAVAILABLE',
      'Assessment service is temporarily unavailable. Please try again in a few moments.',
      503
    );
  }

  // 6–8. Database writes via service client (user_id always from verified session)
  const db = createServiceClient();

  try {
    // 6. Find or create model record; determine version number
    const { data: existingModel, error: lookupError } = await db
      .from('models')
      .select('id')
      .eq('user_id', userId)
      .eq('model_name', modelName)
      .maybeSingle();

    if (lookupError) {
      return errorResponse(
        'DATABASE_ERROR',
        'Something went wrong saving your assessment. Please try again.',
        500
      );
    }

    let modelId: string;

    if (existingModel) {
      modelId = existingModel.id as string;
    } else {
      const { data: newModel, error: modelError } = await db
        .from('models')
        .insert({ user_id: userId, model_name: modelName })
        .select('id')
        .single();

      if (modelError || !newModel) {
        return errorResponse(
          'DATABASE_ERROR',
          'Something went wrong saving your assessment. Please try again.',
          500
        );
      }
      modelId = newModel.id as string;
    }

    // Count existing submissions for this model to derive version number
    const { count, error: countError } = await db
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('model_id', modelId)
      .eq('user_id', userId);

    if (countError) {
      return errorResponse(
        'DATABASE_ERROR',
        'Something went wrong saving your assessment. Please try again.',
        500
      );
    }

    const versionNumber = (count ?? 0) + 1;

    // 7. Insert submission
    // Sprint 1 placeholders: outcomes/monitoring scores = 0, judge_confidence = 0,
    // assessment_confidence_label = 'Low' (DB NOT NULL constraints; Sprint 2 will populate)
    const { data: submission, error: submissionError } = await db
      .from('submissions')
      .insert({
        model_id: modelId,
        user_id: userId,
        version_number: versionNumber,
        document_text: sanitizedText,
        conceptual_score: csOutput.score,
        outcomes_score: 0,
        monitoring_score: 0,
        final_score: csOutput.score,
        gap_analysis: csOutput.gaps,
        judge_confidence: 0,
        assessment_confidence_label: 'Low',
        retry_count: 0,
      })
      .select('id, created_at')
      .single();

    if (submissionError || !submission) {
      return errorResponse(
        'DATABASE_ERROR',
        'Something went wrong saving your assessment. Please try again.',
        500
      );
    }

    const submissionId = submission.id as string;

    // 8. Insert gaps (one row per gap)
    if (csOutput.gaps.length > 0) {
      const gapRows = csOutput.gaps.map((gap: Gap) => ({
        submission_id: submissionId,
        user_id: userId,
        pillar: 'conceptual_soundness',
        element_code: gap.element_code,
        element_name: gap.element_name,
        severity: gap.severity,
        description: gap.description,
        recommendation: gap.recommendation,
      }));

      const { error: gapsError } = await db.from('gaps').insert(gapRows);
      if (gapsError) {
        return errorResponse(
          'DATABASE_ERROR',
          'Something went wrong saving your assessment. Please try again.',
          500
        );
      }
    }

    // 9. Return Sprint 1 response
    return NextResponse.json(
      {
        submissionId,
        modelName,
        versionNumber,
        conceptualScore: csOutput.score,
        outcomesScore: null,
        monitoringScore: null,
        finalScore: csOutput.score,
        status: deriveStatus(csOutput.score),
        gaps: csOutput.gaps,
        judgeConfidence: null,
        assessmentConfidenceLabel: null,
        retryCount: 0,
      },
      { status: 200 }
    );
  } catch {
    return errorResponse(
      'DATABASE_ERROR',
      'Something went wrong saving your assessment. Please try again.',
      500
    );
  }
}
