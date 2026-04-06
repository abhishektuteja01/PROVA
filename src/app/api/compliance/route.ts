import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { sanitizeText, validateFileType } from '@/lib/security/sanitize';
import { parsePDF } from '@/lib/parsers/pdf';
import { parseDOCX } from '@/lib/parsers/docx';
import { runCompliance } from '@/lib/agents/orchestrator';
import { calculateScores } from '@/lib/scoring/calculator';
import { AgentParseError, AgentSchemaError } from '@/lib/agents/errors';
import { ComplianceRequestSchema, MAX_FILE_SIZE_BYTES } from '@/lib/validation/schemas';
import type { Gap } from '@/lib/validation/schemas';
import { errorResponse } from '@/lib/errors/messages';

const MODEL_USED = 'claude-haiku-4-5-20251001';

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
  const requestStartTime = Date.now();

  // 1. Verify session server-side — nothing executes before this check
  let supabase;
  try {
    supabase = await createServerClient();
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('UNKNOWN_ERROR');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse('AUTH_REQUIRED');
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
  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > MAX_FILE_SIZE_BYTES) {
    return errorResponse('FILE_TOO_LARGE');
  }

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
    } finally {
      buffer.fill(0);
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

  // 5. Run full orchestration: 3 parallel agents + judge + retry loop
  let csOutput: Awaited<ReturnType<typeof runCompliance>>['csOutput'];
  let oaOutput: Awaited<ReturnType<typeof runCompliance>>['oaOutput'];
  let omOutput: Awaited<ReturnType<typeof runCompliance>>['omOutput'];
  let judgeOutput: Awaited<ReturnType<typeof runCompliance>>['judgeOutput'];
  let retryCount: number;

  try {
    ({ csOutput, oaOutput, omOutput, judgeOutput, retryCount } = await runCompliance(
      sanitizedText,
      modelName
    ));
  } catch (err) {
    if (err instanceof AgentParseError || err instanceof AgentSchemaError) {
      Sentry.captureException(err);
      return errorResponse('AI_SCHEMA_INVALID');
    }
    Sentry.captureException(err);
    return errorResponse('AI_UNAVAILABLE');
  }

  // 6. Calculate scores from the three agent outputs (always uses canonical formula)
  const scoring = calculateScores(csOutput, oaOutput, omOutput);

  // 7–10. Database writes via service client (user_id always from verified session)
  const db = createServiceClient();

  try {
    // 7. Find or create model record; determine version number
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

      if (modelError && isUniqueViolation(modelError)) {
        // Race condition: another request created the model between our lookup and insert.
        // Re-fetch the now-existing model.
        const { data: raceModel, error: raceError } = await db
          .from('models')
          .select('id')
          .eq('user_id', userId)
          .eq('model_name', modelName)
          .single();

        if (raceError || !raceModel || !hasStringId(raceModel)) {
          Sentry.captureException(raceError ?? new Error('Model re-fetch after race failed'));
          return errorResponse('DATABASE_ERROR');
        }
        modelId = raceModel.id;
      } else if (modelError || !newModel || !hasStringId(newModel)) {
        Sentry.captureException(modelError ?? new Error('Model insert returned no id'));
        return errorResponse('DATABASE_ERROR');
      } else {
        modelId = newModel.id;
      }
    }

    // 8. Insert submission — retry on version number race condition
    const allGaps: Gap[] = [...csOutput.gaps, ...oaOutput.gaps, ...omOutput.gaps];
    const MAX_VERSION_RETRIES = 2;
    let submission: { id: string; created_at: string; version_number: number } | null = null;

    for (let attempt = 0; attempt < MAX_VERSION_RETRIES; attempt++) {
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

      const { data: insertedSubmission, error: submissionError } = await db
        .from('submissions')
        .insert({
          model_id: modelId,
          user_id: userId,
          version_number: versionNumber,
          document_text: sanitizedText,
          conceptual_score: scoring.pillar_scores.conceptual_soundness,
          outcomes_score: scoring.pillar_scores.outcomes_analysis,
          monitoring_score: scoring.pillar_scores.ongoing_monitoring,
          final_score: scoring.final_score,
          gap_analysis: allGaps,
          judge_confidence: judgeOutput.confidence,
          assessment_confidence_label: judgeOutput.confidence_label,
          retry_count: retryCount,
        })
        .select('id, created_at')
        .single();

      if (submissionError) {
        if (isUniqueViolation(submissionError) && attempt < MAX_VERSION_RETRIES - 1) {
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

    // 9. Insert gaps from all three pillars (one row per gap, labelled by pillar)
    const allGapRows = [
      ...csOutput.gaps.map((gap: Gap) => ({
        submission_id: submissionId,
        user_id: userId,
        pillar: 'conceptual_soundness' as const,
        element_code: gap.element_code,
        element_name: gap.element_name,
        severity: gap.severity,
        description: gap.description,
        recommendation: gap.recommendation,
      })),
      ...oaOutput.gaps.map((gap: Gap) => ({
        submission_id: submissionId,
        user_id: userId,
        pillar: 'outcomes_analysis' as const,
        element_code: gap.element_code,
        element_name: gap.element_name,
        severity: gap.severity,
        description: gap.description,
        recommendation: gap.recommendation,
      })),
      ...omOutput.gaps.map((gap: Gap) => ({
        submission_id: submissionId,
        user_id: userId,
        pillar: 'ongoing_monitoring' as const,
        element_code: gap.element_code,
        element_name: gap.element_name,
        severity: gap.severity,
        description: gap.description,
        recommendation: gap.recommendation,
      })),
    ];

    if (allGapRows.length > 0) {
      const { error: gapsError } = await db.from('gaps').insert(allGapRows);
      if (gapsError) {
        // Compensating transaction: delete the orphaned submission row
        Sentry.captureException(gapsError);
        await db.from('submissions').delete().eq('id', submissionId);
        return errorResponse('DATABASE_ERROR');
      }
    }

    // 10. Insert eval record for observability / AI regression tracking
    const inputTextHash = createHash('sha256').update(sanitizedText).digest('hex');
    const { error: evalError } = await db.from('evals').insert({
      submission_id: submissionId,
      input_text_hash: inputTextHash,
      agent_outputs: { cs: csOutput, oa: oaOutput, om: omOutput },
      judge_output: judgeOutput,
      retry_count: retryCount,
      total_latency_ms: Date.now() - requestStartTime,
      model_used: MODEL_USED,
    });

    if (evalError) {
      // Eval failure is non-fatal — log and continue so the user still gets their result
      Sentry.captureException(evalError);
    }

    // 11. Return 200 ComplianceResponse with all fields populated
    return NextResponse.json(
      {
        submission_id: submissionId,
        model_name: modelName,
        version: submission.version_number,
        scoring,
        pillar_outputs: {
          conceptual_soundness: csOutput,
          outcomes_analysis: oaOutput,
          ongoing_monitoring: omOutput,
        },
        judge: judgeOutput,
        all_gaps: allGaps,
        retry_count: retryCount,
        created_at: submission.created_at,
      },
      { status: 200 }
    );
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse('DATABASE_ERROR');
  }
}
