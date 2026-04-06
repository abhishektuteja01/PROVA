import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/errors/messages";
import { ReportRequestSchema } from "@/lib/validation/schemas";
import type { Gap } from "@/lib/validation/schemas";
import { renderReport } from "@/components/report/renderReport";
import { deriveStatus } from "@/lib/scoring/calculator";

export async function POST(request: Request) {
  let supabase;
  try {
    supabase = await createServerClient();
  } catch (err) {
    Sentry.captureException(err);
    return errorResponse("UNKNOWN_ERROR");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("AUTH_REQUIRED");
  }

  // Validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("VALIDATION_ERROR", {
      message: "Request body must be valid JSON.",
    });
  }

  const parsed = ReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", {
      message: parsed.error.issues[0]?.message ?? "Invalid request.",
    });
  }

  const submissionId = parsed.data.submission_id;

  try {
    // Fetch submission with model name join
    const { data: row, error: fetchError } = await supabase
      .from("submissions")
      .select(
        "id, user_id, version_number, conceptual_score, outcomes_score, monitoring_score, final_score, assessment_confidence_label, created_at, models(model_name)"
      )
      .eq("id", submissionId)
      .maybeSingle();

    if (fetchError) {
      Sentry.captureException(fetchError);
      return errorResponse("DATABASE_ERROR");
    }

    // Not found or wrong user (defense in depth — RLS handles it too)
    if (!row || row.user_id !== user.id) {
      return errorResponse("SUBMISSION_NOT_FOUND");
    }

    // Fetch gaps
    const { data: gapRows, error: gapsError } = await supabase
      .from("gaps")
      .select("element_code, element_name, severity, description, recommendation")
      .eq("submission_id", submissionId);

    if (gapsError) {
      Sentry.captureException(gapsError);
      return errorResponse("DATABASE_ERROR");
    }

    // Number()-wrap scores (Supabase NUMERIC columns return strings)
    const finalScore = Number(row.final_score);
    const models = row.models as unknown as { model_name: string } | null;
    const modelName = models?.model_name ?? "Unknown";
    const versionNumber = row.version_number;

    // Render PDF
    let buffer: Buffer;
    try {
      buffer = await renderReport({
        modelName,
        versionNumber,
        finalScore,
        status: deriveStatus(finalScore),
        pillarScores: {
          conceptual_soundness: Number(row.conceptual_score),
          outcomes_analysis: Number(row.outcomes_score),
          ongoing_monitoring: Number(row.monitoring_score),
        },
        gaps: (gapRows ?? []) as Gap[],
        confidenceLabel: row.assessment_confidence_label,
        createdAt: row.created_at,
      });
    } catch (renderErr) {
      console.error("[report] PDF render failed:", renderErr);
      Sentry.captureException(renderErr);
      return errorResponse("REPORT_GENERATION_FAILED");
    }

    const sanitizedName = modelName.replace(/[^a-zA-Z0-9\-_]/g, "-");

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="prova-report-${sanitizedName}-v${versionNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[report] Unexpected error:", err);
    Sentry.captureException(err);
    return errorResponse("DATABASE_ERROR");
  }
}
