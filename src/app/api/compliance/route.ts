import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { sanitizeText, validateFileType } from '@/lib/security/sanitize';
import { parsePDF } from '@/lib/parsers/pdf';
import { parseDOCX } from '@/lib/parsers/docx';
import { assessConceptualSoundness } from '@/lib/agents/conceptualSoundness';
import { AgentParseError, AgentSchemaError } from '@/lib/agents/errors';
import { ComplianceRequestSchema, MAX_FILE_SIZE_BYTES } from '@/lib/validation/schemas';
import type { Gap } from '@/lib/validation/schemas';
import { errorResponse } from '@/lib/errors/messages';

function deriveStatus(score: number): 'Compliant' | 'Needs Improvement' | 'Critical Gaps' {
  const rounded = Math.round(score);
  if (rounded >= 80) return 'Compliant';
  if (rounded >= 60) return 'Needs Improvement';
  return 'Critical Gaps';
}

/** Type guard for Supabase row with an `id` field */
function hasStringId(row: unknown): row is { id: string } {
  return (
    typeof row === 'object' &&
    row !== null &&
    'id' in row &&
    typeof (row as Record<string, unknown>).id === 'string'
  );
}

/** Check if a Supabase error is a unique constraint violation */
function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

export async function POST(request: Request) {
  // 1. Verify session server-side — nothing executes before this check
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse('AUTH_INVALID');
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
    return errorResponse('RATE_LIMIT_EXCEEDED', {
      message: `Assessment limit reached. Try again in ${retryAfterMinutes} minutes.`,
      extras: { retry_after_seconds: retryAfterSeconds },
    });
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
      return errorResponse('VALIDATION_ERROR', { message: 'Could not parse form data.' });
    }

    // Validate model_name field
    const rawModelName = formData.get('model_name');
    if (typeof rawModelName !== 'string' || rawModelName.trim() === '') {
      return errorResponse('VALIDATION_ERROR', { message: 'Model name is required.' });
    }
    const nameResult = ComplianceRequestSchema.pick({ model_name: true }).safeParse({
      model_name: rawModelName,
    });
    if (!nameResult.success) {
      return errorResponse('VALIDATION_ERROR', {
        message: nameResult.error.issues[0]?.message ?? 'Invalid model name.',
      });
    }
    modelName = nameResult.data.model_name;

    // Validate file presence
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return errorResponse('VALIDATION_ERROR', { message: 'A file is required.' });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse('FILE_TOO_LARGE');
    }

    // Validate file type (extension + MIME type)
    if (!validateFileType(file.name, file.type)) {
      return errorResponse('FILE_TYPE_INVALID');
    }

    // Parse file — buffer only, never disk
    const buffer = Buffer.from(await file.arrayBuffer());
    const lowerName = file.name.toLowerCase();

    // Validate magic bytes to prevent content-type spoofing
    const { validateFileMagicBytes } = await import('@/lib/security/sanitize');
    const expectedType = lowerName.endsWith('.pdf') ? 'pdf' : 'docx';
    if (!validateFileMagicBytes(buffer, expectedType)) {
      return errorResponse('FILE_TYPE_INVALID');
    }

    try {
      if (lowerName.endsWith('.pdf')) {
        documentText = await parsePDF(buffer);
      } else {
        documentText = await parseDOCX(buffer);
      }
    } catch {
      return errorResponse('FILE_PARSE_FAILED');
    }
  } else {
    // JSON text paste path
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', { message: 'Request body must be valid JSON.' });
    }

    const result = ComplianceRequestSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('VALIDATION_ERROR', {
        message: result.error.issues[0]?.message ?? 'Invalid request.',
        extras: { details: result.error.flatten() },
      });
    }

    if (!result.data.document_text) {
      return errorResponse('VALIDATION_ERROR', { message: 'Document text is required.' });
    }

    modelName = result.data.model_name;
    documentText = result.data.document_text;
  }

  // 4. Sanitize text before storage and before agent call
  const sanitizedText = sanitizeText(documentText);

  // Validate length after sanitization (file extraction may yield short/long text)
  if (sanitizedText.length < 100) {
    return errorResponse('DOCUMENT_TOO_SHORT');
  }
  if (sanitizedText.length > 50000) {
    return errorResponse('DOCUMENT_TOO_LONG');
  }

  // 5. Run Conceptual Soundness agent (Sprint 1 — single agent)
  // Document wrapped in <document> tags inside assessConceptualSoundness
  let csOutput: Awaited<ReturnType<typeof assessConceptualSoundness>>;
  try {
    csOutput = await assessConceptualSoundness(sanitizedText, modelName);
  } catch (err) {
    if (err instanceof AgentParseError || err instanceof AgentSchemaError) {
      Sentry.captureException(err);
      return errorResponse('AI_SCHEMA_INVALID');
    }
    Sentry.captureException(err);
    return errorResponse('AI_UNAVAILABLE');
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
      Sentry.captureException(lookupError);
      return errorResponse('DATABASE_ERROR');
    }

    let modelId: string;

    if (existingModel && hasStringId(existingModel)) {
      modelId = existingModel.id;
    } else {
      const { data: newModel, error: modelError } = await db
        .from('models')
        .insert({ user_id: userId, model_name: modelName })
        .select('id')
        .single();

      if (modelError || !newModel || !hasStringId(newModel)) {
        Sentry.captureException(modelError ?? new Error('Model insert returned no id'));
        return errorResponse('DATABASE_ERROR');
      }
      modelId = newModel.id;
    }

    // Insert submission with version number retry (handles race condition on concurrent requests)
    const MAX_VERSION_RETRIES = 2;
    let submission: { id: string; created_at: string; version_number: number } | null = null;

    for (let attempt = 0; attempt < MAX_VERSION_RETRIES; attempt++) {
      // Count existing submissions for this model to derive version number
      const { count, error: countError } = await db
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('model_id', modelId)
        .eq('user_id', userId);

      if (countError) {
        Sentry.captureException(countError);
        return errorResponse('DATABASE_ERROR');
      }

      const versionNumber = (count ?? 0) + 1;

      // 7. Insert submission
      // Sprint 1 placeholders: outcomes/monitoring scores = 0, judge_confidence = 0,
      // assessment_confidence_label = 'Low' (DB NOT NULL constraints; Sprint 2 will populate)
      const { data: insertedSubmission, error: submissionError } = await db
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

      if (submissionError) {
        if (isUniqueViolation(submissionError) && attempt < MAX_VERSION_RETRIES - 1) {
          // Version number race condition — retry with recalculated version
          continue;
        }
        Sentry.captureException(submissionError);
        return errorResponse('DATABASE_ERROR');
      }

      if (
        !insertedSubmission ||
        !hasStringId(insertedSubmission) ||
        !('created_at' in insertedSubmission)
      ) {
        Sentry.captureException(new Error('Submission insert returned unexpected shape'));
        return errorResponse('DATABASE_ERROR');
      }

      submission = {
        id: insertedSubmission.id,
        created_at: String(insertedSubmission.created_at),
        version_number: versionNumber,
      };
      break;
    }

    if (!submission) {
      return errorResponse('DATABASE_ERROR');
    }

    const submissionId = submission.id;

    // 8. Insert gaps (one row per gap) with compensating delete on failure
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
        // Compensating transaction: delete the orphaned submission row
        Sentry.captureException(gapsError);
        await db.from('submissions').delete().eq('id', submissionId);
        return errorResponse('DATABASE_ERROR');
      }
    }

    // 9. Return Sprint 1 response
    return NextResponse.json(
      {
        submissionId,
        modelName,
        versionNumber: submission.version_number,
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
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('DATABASE_ERROR');
  }
}
