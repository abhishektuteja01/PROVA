"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Toast from "@/components/ui/Toast";
import { getScoreColor } from "@/components/dashboard/utils";
import type { CompareResponse } from "@/lib/validation/schemas";

const PILLAR_LABELS: Record<string, string> = {
  conceptual_soundness: "Conceptual Soundness",
  outcomes_analysis: "Outcomes Analysis",
  ongoing_monitoring: "Ongoing Monitoring",
};

const DISPUTE_TYPE_LABELS: Record<string, string> = {
  false_positive: "False positive",
  wrong_severity: "Wrong severity",
  missing_context: "Missing context",
};

const SECTION_HEADER_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-playfair)",
  fontSize: "18px",
  fontWeight: 600,
  color: "var(--color-text-primary)",
  marginBottom: "12px",
};

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "10px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--color-text-secondary)",
  marginBottom: "6px",
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "var(--color-critical)",
  Major: "var(--color-warning)",
  Minor: "var(--color-text-secondary)",
};

function deltaColor(delta: number): string {
  if (delta > 0) return "var(--color-compliant)";
  if (delta < 0) return "var(--color-critical)";
  return "var(--color-text-secondary)";
}

function deltaArrow(delta: number): string {
  if (delta > 0) return "↑";
  if (delta < 0) return "↓";
  return "→";
}

function formatDelta(delta: number): string {
  if (delta === 0) return "0";
  const rounded = Math.round(delta * 10) / 10;
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

function CompareSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Skeleton height={120} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={92} />
        ))}
      </div>
      <Skeleton height={200} />
      <Skeleton height={150} />
    </div>
  );
}

function ScoreDeltaCard({
  label,
  before,
  after,
  delta,
  highlighted,
}: {
  label: string;
  before: number;
  after: number;
  delta: number;
  highlighted?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--color-bg-secondary)",
        border: highlighted
          ? "1px solid color-mix(in srgb, var(--color-accent) 50%, transparent)"
          : "1px solid var(--color-border)",
        borderRadius: "2px",
        padding: "16px",
      }}
    >
      <div style={LABEL_STYLE}>{label}</div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          marginTop: "6px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono)",
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            textDecoration: "line-through",
          }}
        >
          {Math.round(before)}
        </span>
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono)",
            fontSize: "26px",
            fontWeight: 600,
            color: getScoreColor(after),
          }}
        >
          {Math.round(after)}
        </span>
      </div>
      <div
        style={{
          marginTop: "6px",
          fontFamily: "var(--font-ibm-plex-mono)",
          fontSize: "12px",
          fontWeight: 500,
          color: deltaColor(delta),
        }}
      >
        {deltaArrow(delta)} {formatDelta(delta)}
      </div>
    </div>
  );
}

function GapRow({
  code,
  name,
  severityBefore,
  severityAfter,
  description,
}: {
  code: string;
  name: string;
  severityBefore?: string;
  severityAfter?: string;
  description?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "10px 12px",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono)",
            fontSize: "11px",
            color: "var(--color-accent)",
          }}
        >
          {code}
        </span>
        <span
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "12px",
            color: "var(--color-text-primary)",
          }}
        >
          {name}
        </span>
        {severityBefore && severityAfter ? (
          <span
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              marginLeft: "auto",
            }}
          >
            <span
              style={{
                color: SEVERITY_COLORS[severityBefore] ?? "var(--color-text-secondary)",
                textDecoration: "line-through",
              }}
            >
              {severityBefore}
            </span>
            <span style={{ margin: "0 6px", color: "var(--color-text-secondary)" }}>
              &rarr;
            </span>
            <span
              style={{ color: SEVERITY_COLORS[severityAfter] ?? "var(--color-text-secondary)" }}
            >
              {severityAfter}
            </span>
          </span>
        ) : severityAfter ? (
          <span
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              marginLeft: "auto",
              color: SEVERITY_COLORS[severityAfter] ?? "var(--color-text-secondary)",
            }}
          >
            {severityAfter}
          </span>
        ) : severityBefore ? (
          <span
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              marginLeft: "auto",
              color: SEVERITY_COLORS[severityBefore] ?? "var(--color-text-secondary)",
            }}
          >
            {severityBefore}
          </span>
        ) : null}
      </div>
      {description ? (
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "11px",
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      ) : null}
    </div>
  );
}

export default function ComparePage() {
  const params = useParams<{ id: string; reassessmentId: string }>();
  const id = params.id;
  const reassessmentId = params.reassessmentId;

  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" } | null>(null);

  useEffect(() => {
    if (!id || !reassessmentId) return;

    async function fetchCompare() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(
          `/api/submissions/${id}/compare/${reassessmentId}`
        );
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
          const body = (await res.json().catch(() => null)) as { message?: string } | null;
          setToast({
            message: body?.message ?? "Failed to load comparison.",
            type: "error",
          });
          setLoading(false);
          return;
        }
        const body = (await res.json()) as CompareResponse;
        setData(body);
      } catch {
        setToast({
          message: "Network error. Please check your connection.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCompare();
  }, [id, reassessmentId]);

  return (
    <main
      style={{
        background: "var(--color-bg-primary)",
        minHeight: "100vh",
        padding: "32px 20px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <Link
          href={`/submissions/${id}`}
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "13px",
            color: "var(--color-accent)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "24px",
          }}
        >
          &larr; Back to submission
        </Link>

        {loading && <CompareSkeleton />}

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
                Comparison not found
              </div>
              <div
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                }}
              >
                The re-assessment may have been deleted or does not belong to this submission.
              </div>
            </div>
          </Card>
        )}

        {!loading && data && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "26px",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: "0 0 6px 0",
                }}
              >
                Re-assessment comparison
              </h1>
              <div
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                }}
              >
                {data.parent.model_name} v{data.parent.version_number} &middot; pillar
                re-assessed: <strong>{PILLAR_LABELS[data.pillar_reassessed]}</strong>
              </div>
            </div>

            {data.reassessment.low_confidence_manual_review && (
              <div
                style={{
                  background:
                    "color-mix(in srgb, var(--color-warning) 10%, var(--color-bg-secondary))",
                  border:
                    "1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)",
                  borderRadius: "2px",
                  padding: "14px 18px",
                  fontFamily: "var(--font-geist)",
                  fontSize: "13px",
                  color: "var(--color-warning)",
                  lineHeight: 1.5,
                }}
              >
                Re-assessment finished below the 0.7 confidence threshold &mdash; flagged
                for manual review.
              </div>
            )}

            {/* Score deltas */}
            <div>
              <div style={SECTION_HEADER_STYLE}>Score deltas</div>
              <div
                className="grid grid-cols-1 md:grid-cols-4 gap-3"
                style={{ display: "grid", gap: "12px" }}
              >
                <ScoreDeltaCard
                  label="Final score"
                  before={data.parent.final_score}
                  after={data.reassessment.final_score}
                  delta={data.pillar_score_deltas.final_score}
                  highlighted
                />
                <ScoreDeltaCard
                  label="Conceptual"
                  before={data.parent.conceptual_score}
                  after={data.reassessment.conceptual_score}
                  delta={data.pillar_score_deltas.conceptual_soundness}
                  highlighted={data.pillar_reassessed === "conceptual_soundness"}
                />
                <ScoreDeltaCard
                  label="Outcomes"
                  before={data.parent.outcomes_score}
                  after={data.reassessment.outcomes_score}
                  delta={data.pillar_score_deltas.outcomes_analysis}
                  highlighted={data.pillar_reassessed === "outcomes_analysis"}
                />
                <ScoreDeltaCard
                  label="Monitoring"
                  before={data.parent.monitoring_score}
                  after={data.reassessment.monitoring_score}
                  delta={data.pillar_score_deltas.ongoing_monitoring}
                  highlighted={data.pillar_reassessed === "ongoing_monitoring"}
                />
              </div>
            </div>

            {/* Dispute events */}
            <div>
              <div style={SECTION_HEADER_STYLE}>Dispute(s) that triggered this re-run</div>
              {data.dispute_events.length === 0 ? (
                <div
                  style={{
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border)",
                    padding: "16px",
                    fontFamily: "var(--font-geist)",
                    fontSize: "12px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  No dispute records found.
                </div>
              ) : (
                <div
                  style={{
                    background: "var(--color-bg-secondary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {data.dispute_events.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--color-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-geist)",
                          fontSize: "11px",
                          color: "var(--color-text-secondary)",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {DISPUTE_TYPE_LABELS[d.dispute_type] ?? d.dispute_type}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-geist)",
                          fontSize: "13px",
                          color: "var(--color-text-primary)",
                          lineHeight: 1.5,
                        }}
                      >
                        {d.reviewer_rationale}
                      </div>
                      {d.proposed_resolution ? (
                        <div
                          style={{
                            fontFamily: "var(--font-geist)",
                            fontSize: "12px",
                            color: "var(--color-text-secondary)",
                            lineHeight: 1.5,
                            paddingTop: "4px",
                            borderTop: "1px dashed var(--color-border)",
                            marginTop: "4px",
                          }}
                        >
                          <span style={{ color: "var(--color-text-secondary)" }}>
                            Proposed resolution:{" "}
                          </span>
                          {d.proposed_resolution}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gap diff */}
            <div>
              <div style={SECTION_HEADER_STYLE}>Gap diff</div>
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-geist)",
                      fontSize: "11px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-compliant)",
                      marginBottom: "6px",
                    }}
                  >
                    Removed ({data.gap_diff.removed.length})
                  </div>
                  <div
                    style={{
                      background: "var(--color-bg-secondary)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {data.gap_diff.removed.length === 0 ? (
                      <div
                        style={{
                          padding: "12px",
                          fontFamily: "var(--font-geist)",
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        No gaps removed.
                      </div>
                    ) : (
                      data.gap_diff.removed.map((g) => (
                        <GapRow
                          key={`r-${g.id}`}
                          code={g.element_code}
                          name={g.element_name}
                          severityBefore={g.severity}
                          description={g.description}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-geist)",
                      fontSize: "11px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-critical)",
                      marginBottom: "6px",
                    }}
                  >
                    Added ({data.gap_diff.added.length})
                  </div>
                  <div
                    style={{
                      background: "var(--color-bg-secondary)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {data.gap_diff.added.length === 0 ? (
                      <div
                        style={{
                          padding: "12px",
                          fontFamily: "var(--font-geist)",
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        No gaps added.
                      </div>
                    ) : (
                      data.gap_diff.added.map((g) => (
                        <GapRow
                          key={`a-${g.id}`}
                          code={g.element_code}
                          name={g.element_name}
                          severityAfter={g.severity}
                          description={g.description}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-geist)",
                      fontSize: "11px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--color-warning)",
                      marginBottom: "6px",
                    }}
                  >
                    Severity changed ({data.gap_diff.severity_changed.length})
                  </div>
                  <div
                    style={{
                      background: "var(--color-bg-secondary)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {data.gap_diff.severity_changed.length === 0 ? (
                      <div
                        style={{
                          padding: "12px",
                          fontFamily: "var(--font-geist)",
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        No severity changes.
                      </div>
                    ) : (
                      data.gap_diff.severity_changed.map((s) => (
                        <GapRow
                          key={`s-${s.element_code}`}
                          code={s.element_code}
                          name={s.element_name}
                          severityBefore={s.before}
                          severityAfter={s.after}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            visible={!!toast}
            onClose={() => setToast(null)}
            duration={5000}
          />
        )}
      </div>
    </main>
  );
}
