"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import { getScoreColor, timeAgo } from "./utils";

interface OverviewPanelProps {
  totalModels: number;
  averageScore: number;
  statusCounts: {
    compliant: number;
    needsImprovement: number;
    criticalGaps: number;
  };
  latestSubmission: {
    modelName: string;
    score: number;
    createdAt: string;
  } | null;
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "10px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--color-text-secondary)",
  marginBottom: "10px",
};

const VALUE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-ibm-plex-mono)",
  fontSize: "32px",
  fontWeight: 600,
  lineHeight: 1,
  color: "var(--color-text-primary)",
};

export default function OverviewPanel({
  totalModels,
  averageScore,
  statusCounts,
  latestSubmission,
}: OverviewPanelProps) {
  if (totalModels === 0) {
    return (
      <Card animate delay={0}>
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "14px",
              color: "var(--color-text-secondary)",
              marginBottom: "16px",
            }}
          >
            No assessments yet. Run your first compliance check to see results
            here.
          </div>
          <Link
            href="/check"
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            Start a compliance check &rarr;
          </Link>
        </div>
      </Card>
    );
  }

  const cards = [
    {
      label: "Total Models",
      render: () => <div style={VALUE_STYLE}>{totalModels}</div>,
    },
    {
      label: "Average Score",
      render: () => (
        <div style={{ ...VALUE_STYLE, color: getScoreColor(averageScore) }}>
          {Math.round(averageScore)}
        </div>
      ),
    },
    {
      label: "Status Breakdown",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            {
              label: "Compliant",
              count: statusCounts.compliant,
              color: "var(--color-compliant)",
            },
            {
              label: "Needs Improvement",
              count: statusCounts.needsImprovement,
              color: "var(--color-warning)",
            },
            {
              label: "Critical Gaps",
              count: statusCounts.criticalGaps,
              color: "var(--color-critical)",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    display: "block",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: item.color,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-geist)",
                    fontSize: "12px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {item.label}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-ibm-plex-mono)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: item.color,
                }}
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      label: "Most Recent",
      render: () =>
        latestSubmission ? (
          <div>
            <div
              style={{
                fontFamily: "var(--font-geist)",
                fontSize: "13px",
                color: "var(--color-text-primary)",
                marginBottom: "6px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {latestSubmission.modelName}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-ibm-plex-mono)",
                  fontSize: "22px",
                  fontWeight: 600,
                  color: getScoreColor(latestSubmission.score),
                }}
              >
                {Math.round(latestSubmission.score)}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "11px",
                  color: "var(--color-text-secondary)",
                }}
              >
                {timeAgo(latestSubmission.createdAt)}
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "12px",
              color: "var(--color-text-secondary)",
            }}
          >
            No submissions yet
          </div>
        ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card key={card.label} animate delay={i * 0.08}>
          <div style={LABEL_STYLE}>{card.label}</div>
          {card.render()}
        </Card>
      ))}
    </div>
  );
}
