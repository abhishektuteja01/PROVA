"use client";

import { motion } from "framer-motion";
import type { ComplianceResponse, Gap } from "@/lib/validation/schemas";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getScoreColor } from "@/components/dashboard/utils";
import type { Status } from "@/components/dashboard/utils";
import PillarScoreCard from "./PillarScoreCard";
import GapAnalysisTable from "./GapAnalysisTable";

interface ComplianceResultsProps {
  result: ComplianceResponse;
  onRunAnother: () => void;
}

function countGapsBySeverity(
  gaps: Gap[],
  pillar: string
): { critical: number; major: number; minor: number } {
  const pillarGaps = gaps.filter((g) => {
    const prefix = g.element_code.slice(0, 2);
    if (pillar === "conceptual_soundness") return prefix === "CS";
    if (pillar === "outcomes_analysis") return prefix === "OA";
    if (pillar === "ongoing_monitoring") return prefix === "OM";
    return false;
  });
  return {
    critical: pillarGaps.filter((g) => g.severity === "Critical").length,
    major: pillarGaps.filter((g) => g.severity === "Major").length,
    minor: pillarGaps.filter((g) => g.severity === "Minor").length,
  };
}

export default function ComplianceResults({
  result,
  onRunAnother,
}: ComplianceResultsProps) {
  const { scoring, judge, all_gaps, model_name, version } = result;
  const { final_score, status, pillar_scores } = scoring;
  const color = getScoreColor(final_score);
  const isLowConfidence = judge.confidence_label === "Low";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Low confidence warning */}
      {isLowConfidence && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background:
              "color-mix(in srgb, var(--color-warning) 10%, var(--color-bg-secondary))",
            border: "1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)",
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
            Low confidence assessment — results may be less reliable. Consider
            resubmitting with more detailed documentation.
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
              {model_name}{" "}
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
                v{version}
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
              Compliance Score
            </div>
          </div>
          <Badge status={status as Status} />
        </div>

        {/* Large score */}
        <div
          style={{
            fontFamily: "var(--font-ibm-plex-mono)",
            fontSize: "72px",
            fontWeight: 600,
            lineHeight: 1,
            color,
            marginBottom: "16px",
          }}
        >
          {Math.round(final_score)}
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
              value: scoring.total_gaps,
              color: "var(--color-text-primary)",
            },
            {
              label: "Critical",
              value: scoring.critical_gap_count,
              color:
                scoring.critical_gap_count > 0
                  ? "var(--color-critical)"
                  : "var(--color-text-secondary)",
            },
            {
              label: "Major",
              value: scoring.major_gap_count,
              color:
                scoring.major_gap_count > 0
                  ? "var(--color-warning)"
                  : "var(--color-text-secondary)",
            },
            {
              label: "Minor",
              value: scoring.minor_gap_count,
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
          score={pillar_scores.conceptual_soundness}
          gapCounts={countGapsBySeverity(all_gaps, "conceptual_soundness")}
          delay={0.08}
        />
        <PillarScoreCard
          pillarName="Outcomes Analysis"
          weight="35%"
          score={pillar_scores.outcomes_analysis}
          gapCounts={countGapsBySeverity(all_gaps, "outcomes_analysis")}
          delay={0.16}
        />
        <PillarScoreCard
          pillarName="Ongoing Monitoring"
          weight="25%"
          score={pillar_scores.ongoing_monitoring}
          gapCounts={countGapsBySeverity(all_gaps, "ongoing_monitoring")}
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
        <GapAnalysisTable gaps={all_gaps} />
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Button
          variant="outline"
          disabled
          style={{ opacity: 0.5, cursor: "not-allowed" }}
        >
          Download Report (Coming Soon)
        </Button>
        <Button variant="ghost" onClick={onRunAnother}>
          Run Another Check
        </Button>
      </div>
    </div>
  );
}
