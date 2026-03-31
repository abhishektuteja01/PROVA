import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { UserPreferencesSchema } from "@/lib/validation/schemas";
import type { SubmissionListItem } from "@/lib/validation/schemas";
import OverviewPanel from "@/components/dashboard/OverviewPanel";
import ModelInventoryTable from "@/components/dashboard/ModelInventoryTable";
import ScoreProgressionChart from "@/components/dashboard/ScoreProgressionChart";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import { getStatusFromScore } from "@/components/dashboard/utils";

interface SubmissionJoinRow {
  id: string;
  version_number: number;
  conceptual_score: number;
  outcomes_score: number;
  monitoring_score: number;
  final_score: number;
  assessment_confidence_label: string;
  created_at: string;
  models: { model_name: string } | null;
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Parallel fetch: submissions (with model name join), models, preferences
  const [subsResult, modelsResult, prefsResult] = await Promise.all([
    supabase
      .from("submissions")
      .select(
        "id, version_number, conceptual_score, outcomes_score, monitoring_score, final_score, assessment_confidence_label, created_at, models(model_name)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("models")
      .select("id, model_name, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("user_preferences")
      .select(
        "show_overview_panel, show_model_inventory, show_score_progression, show_recent_activity"
      )
      .single(),
  ]);

  // Parse preferences with defaults
  const prefs = UserPreferencesSchema.parse(prefsResult.data ?? {});

  // Flatten join rows into SubmissionListItem[]
  const rawRows = (subsResult.data ?? []) as Array<Record<string, unknown>>;
  const submissions: SubmissionListItem[] = rawRows.map((row) => {
    const r = row as unknown as SubmissionJoinRow;
    return {
      id: r.id,
      model_name: r.models?.model_name ?? "Unknown Model",
      version_number: r.version_number,
      conceptual_score: r.conceptual_score,
      outcomes_score: r.outcomes_score,
      monitoring_score: r.monitoring_score,
      final_score: r.final_score,
      status: getStatusFromScore(r.final_score),
      assessment_confidence_label: r.assessment_confidence_label as
        | "High"
        | "Medium"
        | "Low",
      created_at: r.created_at,
    };
  });

  // Compute overview aggregates
  const totalModels = modelsResult.data?.length ?? 0;
  const averageScore =
    submissions.length > 0
      ? submissions.reduce((sum, s) => sum + s.final_score, 0) /
        submissions.length
      : 0;

  const statusCounts = { compliant: 0, needsImprovement: 0, criticalGaps: 0 };
  for (const s of submissions) {
    const status = getStatusFromScore(s.final_score);
    if (status === "Compliant") statusCounts.compliant++;
    else if (status === "Needs Improvement") statusCounts.needsImprovement++;
    else statusCounts.criticalGaps++;
  }

  const latestSubmission =
    submissions.length > 0
      ? {
          modelName: submissions[0].model_name,
          score: submissions[0].final_score,
          createdAt: submissions[0].created_at,
        }
      : null;

  // Group submissions by model for score progression chart
  const submissionsByModel: Record<string, SubmissionListItem[]> = {};
  for (const s of submissions) {
    if (!submissionsByModel[s.model_name]) {
      submissionsByModel[s.model_name] = [];
    }
    submissionsByModel[s.model_name].push(s);
  }

  // Only models with 2+ submissions are eligible for the chart
  const chartEligibleModels = Object.keys(submissionsByModel).filter(
    (name) => submissionsByModel[name].length >= 2
  );

  // Recent activity: last 10 submissions (already sorted desc)
  const recentSubmissions = submissions.slice(0, 10);

  const allSectionsHidden =
    !prefs.show_overview_panel &&
    !prefs.show_model_inventory &&
    !prefs.show_score_progression &&
    !prefs.show_recent_activity;

  return (
    <main
      style={{
        background: "var(--color-bg-primary)",
        minHeight: "100vh",
        padding: "32px 20px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Page heading */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Dashboard
          </h1>
          <p
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "14px",
              color: "var(--color-text-secondary)",
              margin: "8px 0 0",
            }}
          >
            {totalModels === 0
              ? "Welcome to Prova — start by running a compliance check."
              : `${totalModels} model${totalModels !== 1 ? "s" : ""} tracked`}
          </p>
        </div>

        {/* Sections — each conditionally rendered per user preferences */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {allSectionsHidden && (
            <div
              style={{
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: "2px",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  marginBottom: "16px",
                }}
              >
                All dashboard sections are currently hidden.
              </div>
              <Link
                href="/settings"
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-accent)",
                  textDecoration: "none",
                }}
              >
                Adjust visibility in Settings &rarr;
              </Link>
            </div>
          )}

          {prefs.show_overview_panel && (
            <OverviewPanel
              totalModels={totalModels}
              averageScore={averageScore}
              statusCounts={statusCounts}
              latestSubmission={latestSubmission}
            />
          )}

          {prefs.show_model_inventory && (
            <ModelInventoryTable submissions={submissions} />
          )}

          {prefs.show_score_progression && chartEligibleModels.length > 0 && (
            <ScoreProgressionChart
              submissionsByModel={submissionsByModel}
              modelNames={chartEligibleModels}
            />
          )}

          {prefs.show_recent_activity && (
            <RecentActivityFeed submissions={recentSubmissions} />
          )}
        </div>
      </div>
    </main>
  );
}
