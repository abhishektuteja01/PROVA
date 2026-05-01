import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import {
  ModelTypeEnum,
  type SubmissionListItem,
} from "@/lib/validation/schemas";
import { getStatusFromScore } from "@/components/dashboard/utils";
import BenchmarksView from "@/components/dashboard/BenchmarksView";

interface SubmissionJoinRow {
  id: string;
  version_number: number;
  conceptual_score: number;
  outcomes_score: number;
  monitoring_score: number;
  final_score: number;
  assessment_confidence_label: string;
  model_type: string;
  is_synthetic: boolean;
  created_at: string;
  models: { model_name: string } | null;
}

export default async function BenchmarksPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // The dropdown lists this user's own assessments only — RLS scope on the
  // base SELECT. Cross-user comparisons go exclusively through the
  // get_benchmark_stats RPC, never a direct read.
  const { data: rows } = await supabase
    .from("submissions")
    .select(
      "id, version_number, conceptual_score, outcomes_score, monitoring_score, final_score, assessment_confidence_label, model_type, is_synthetic, created_at, models(model_name)"
    )
    .is("parent_assessment_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const submissions: SubmissionListItem[] = ((rows ?? []) as Array<Record<string, unknown>>).map(
    (raw) => {
      const r = raw as unknown as SubmissionJoinRow;
      return {
        id: r.id,
        model_name: r.models?.model_name ?? "Unknown Model",
        model_type: ModelTypeEnum.catch("other").parse(r.model_type),
        is_synthetic: Boolean(r.is_synthetic),
        version_number: r.version_number,
        conceptual_score: Number(r.conceptual_score),
        outcomes_score: Number(r.outcomes_score),
        monitoring_score: Number(r.monitoring_score),
        final_score: Number(r.final_score),
        status: getStatusFromScore(Number(r.final_score)),
        assessment_confidence_label: r.assessment_confidence_label as
          | "High"
          | "Medium"
          | "Low",
        created_at: r.created_at,
      };
    }
  );

  return (
    <main
      style={{
        background: "var(--color-bg-primary)",
        minHeight: "100vh",
        padding: "32px 20px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
            Benchmarks
          </h1>
          <p
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "14px",
              color: "var(--color-text-secondary)",
              margin: "8px 0 0",
            }}
          >
            Compare a single assessment against the corpus median for the same
            model type.
          </p>
        </div>

        <BenchmarksView submissions={submissions} />
      </div>
    </main>
  );
}
