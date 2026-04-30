"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type {
  GapWithId,
  ReassessmentResponse,
  SubmissionDetail,
} from "@/lib/validation/schemas";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Toast from "@/components/ui/Toast";
import { getScoreColor } from "@/components/dashboard/utils";
import type { Status } from "@/components/dashboard/utils";
import PillarScoreCard from "@/components/compliance/PillarScoreCard";
import GapAnalysisTable from "@/components/compliance/GapAnalysisTable";
import DisputeModal from "@/components/compliance/DisputeModal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countGapsBySeverity(
  gaps: GapWithId[],
  prefix: "CS" | "OA" | "OM"
): { critical: number; major: number; minor: number } {
  const pillarGaps = gaps.filter((g) => g.element_code.startsWith(prefix));
  return {
    critical: pillarGaps.filter((g) => g.severity === "Critical").length,
    major: pillarGaps.filter((g) => g.severity === "Major").length,
    minor: pillarGaps.filter((g) => g.severity === "Minor").length,
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ConfidenceBadge({ label }: { label: string }) {
  const colors: Record<string, string> = {
    High: "var(--color-compliant)",
    Medium: "var(--color-warning)",
    Low: "var(--color-critical)",
  };
  const color = colors[label] ?? "var(--color-text-secondary)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px",
        borderRadius: "100px",
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
        fontFamily: "var(--font-geist)",
        fontSize: "11px",
        fontWeight: 500,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {label} Confidence
    </span>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function DetailLoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Main score card skeleton */}
      <div
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          borderRadius: "2px",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <Skeleton width={180} height={14} />
          <div style={{ display: "flex", gap: "8px" }}>
            <Skeleton width={100} height={24} borderRadius={100} />
            <Skeleton width={90} height={24} borderRadius={100} />
          </div>
        </div>
        <Skeleton width={120} height={72} style={{ marginBottom: "16px" }} />
        <Skeleton
          height={1}
          style={{ width: "100%", marginBottom: "16px" }}
        />
        <div style={{ display: "flex", gap: "20px" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton
                width={40}
                height={18}
                style={{ marginBottom: "4px" }}
              />
              <Skeleton width={50} height={10} />
            </div>
          ))}
        </div>
      </div>

      {/* 3 pillar card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "2px",
              padding: "20px",
            }}
          >
            <Skeleton
              width={140}
              height={10}
              style={{ marginBottom: "12px" }}
            />
            <Skeleton
              width={60}
              height={36}
              style={{ marginBottom: "16px" }}
            />
            <Skeleton
              height={1}
              style={{ width: "100%", marginBottom: "12px" }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              {[0, 1, 2].map((j) => (
                <Skeleton key={j} width={40} height={16} style={{ flex: 1 }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Gap table skeleton */}
      <div>
        <Skeleton width={120} height={18} style={{ marginBottom: "12px" }} />
        <div
          style={{
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
          }}
        >
          <Skeleton height={36} style={{ width: "100%" }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              height={48}
              style={{ width: "100%", opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main page component ─────────────────────────────────────────────────────

export default function SubmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error";
  } | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [disputeGap, setDisputeGap] = useState<GapWithId | null>(null);

  const handleDownloadReport = async () => {
    setDownloadLoading(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: id }),
      });
      if (!res.ok) throw new Error("Failed to generate report");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("content-disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") ?? "prova-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({
        message: "Failed to generate report. Please try again.",
        type: "error",
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    async function fetchDetail() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`/api/submissions/${id}`);
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            message?: string;
          } | null;
          setToast({
            message: body?.message ?? "Failed to load submission.",
            type: "error",
          });
          setLoading(false);
          return;
        }
        const data = (await res.json()) as SubmissionDetail;
        setSubmission(data);
      } catch {
        setToast({
          message: "Network error. Please check your connection.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [id]);

  const gapStats = useMemo(() => {
    if (!submission) return null;
    const gaps = submission.gap_analysis;
    return {
      total: gaps.length,
      critical: gaps.filter((g) => g.severity === "Critical").length,
      major: gaps.filter((g) => g.severity === "Major").length,
      minor: gaps.filter((g) => g.severity === "Minor").length,
      cs: countGapsBySeverity(gaps, "CS"),
      oa: countGapsBySeverity(gaps, "OA"),
      om: countGapsBySeverity(gaps, "OM"),
    };
  }, [submission]);

  return (
    <main
      style={{
        background: "var(--color-bg-primary)",
        minHeight: "100vh",
        padding: "32px 20px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Back link */}
        <Link
          href="/submissions"
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "13px",
            color: "var(--color-accent)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "24px",
          }}
        >
          &larr; Back to History
        </Link>

        {/* Loading */}
        {loading && <DetailLoadingSkeleton />}

        {/* Not found */}
        {!loading && notFound && (
          <Card animate>
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  marginBottom: "6px",
                }}
              >
                Submission not found
              </div>
              <div
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  marginBottom: "16px",
                }}
              >
                This submission may have been deleted.
              </div>
              <Link
                href="/submissions"
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--color-accent)",
                  textDecoration: "none",
                }}
              >
                Back to Submission History &rarr;
              </Link>
            </div>
          </Card>
        )}

        {/* Detail content */}
        {!loading && submission && gapStats && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Low confidence warning */}
            {submission.assessment_confidence_label === "Low" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background:
                    "color-mix(in srgb, var(--color-warning) 10%, var(--color-bg-secondary))",
                  border:
                    "1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)",
                  borderRadius: "2px",
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--color-warning)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-geist)",
                    fontSize: "13px",
                    color: "var(--color-warning)",
                    lineHeight: 1.4,
                  }}
                >
                  Low confidence assessment — results may be less reliable.
                  Consider resubmitting with more detailed documentation.
                </span>
              </motion.div>
            )}

            {/* Main score card */}
            <Card animate delay={0}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-geist)",
                      fontSize: "14px",
                      color: "var(--color-text-primary)",
                      marginBottom: "4px",
                    }}
                  >
                    {submission.model_name}{" "}
                    <span
                      style={{
                        fontFamily: "var(--font-ibm-plex-mono)",
                        fontSize: "11px",
                        color: "var(--color-text-secondary)",
                        background: "var(--color-bg-tertiary)",
                        padding: "2px 6px",
                        borderRadius: "2px",
                        marginLeft: "6px",
                      }}
                    >
                      v{submission.version_number}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-geist)",
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Compliance Score &middot;{" "}
                    {formatDate(submission.created_at)}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <ConfidenceBadge
                    label={submission.assessment_confidence_label}
                  />
                  <Badge status={submission.status as Status} />
                </div>
              </div>

              {/* Large score */}
              <div
                style={{
                  fontFamily: "var(--font-ibm-plex-mono)",
                  fontSize: "72px",
                  fontWeight: 600,
                  lineHeight: 1,
                  color: getScoreColor(submission.final_score),
                  marginBottom: "16px",
                }}
              >
                {Math.round(submission.final_score)}
              </div>

              {/* Gap summary row */}
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "16px",
                }}
              >
                {[
                  {
                    label: "Total Gaps",
                    value: gapStats.total,
                    color: "var(--color-text-primary)",
                  },
                  {
                    label: "Critical",
                    value: gapStats.critical,
                    color:
                      gapStats.critical > 0
                        ? "var(--color-critical)"
                        : "var(--color-text-secondary)",
                  },
                  {
                    label: "Major",
                    value: gapStats.major,
                    color:
                      gapStats.major > 0
                        ? "var(--color-warning)"
                        : "var(--color-text-secondary)",
                  },
                  {
                    label: "Minor",
                    value: gapStats.minor,
                    color: "var(--color-text-secondary)",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div
                      style={{
                        fontFamily: "var(--font-ibm-plex-mono)",
                        fontSize: "18px",
                        fontWeight: 600,
                        color: item.color,
                        marginBottom: "2px",
                      }}
                    >
                      {item.value}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-geist)",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pillar score cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PillarScoreCard
                pillarName="Conceptual Soundness"
                weight="40%"
                score={submission.conceptual_score}
                gapCounts={gapStats.cs}
                delay={0.08}
              />
              <PillarScoreCard
                pillarName="Outcomes Analysis"
                weight="35%"
                score={submission.outcomes_score}
                gapCounts={gapStats.oa}
                delay={0.16}
              />
              <PillarScoreCard
                pillarName="Ongoing Monitoring"
                weight="25%"
                score={submission.monitoring_score}
                gapCounts={gapStats.om}
                delay={0.24}
              />
            </div>

            {/* Gap analysis table */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  marginBottom: "12px",
                }}
              >
                Gap Analysis
              </div>
              <GapAnalysisTable
                gaps={submission.gap_analysis}
                onDispute={(g) => setDisputeGap(g)}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Button
                variant="outline"
                disabled={downloadLoading}
                onClick={handleDownloadReport}
              >
                {downloadLoading ? "Generating Report..." : "Download Report"}
              </Button>
              <Link href="/submissions" style={{ textDecoration: "none" }}>
                <Button variant="ghost">Back to History</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            visible={!!toast}
            onClose={() => setToast(null)}
            duration={5000}
          />
        )}

        {/* Dispute modal */}
        <DisputeModal
          open={!!disputeGap}
          onClose={() => setDisputeGap(null)}
          assessmentId={id ?? ""}
          gap={disputeGap}
          onSuccess={(res: ReassessmentResponse) => {
            setDisputeGap(null);
            router.push(`/submissions/${id}/compare/${res.reassessment_id}`);
          }}
        />
      </div>
    </main>
  );
}
