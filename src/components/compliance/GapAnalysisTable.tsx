"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Gap } from "@/lib/validation/schemas";

interface GapAnalysisTableProps {
  gaps: Gap[];
}

const SEVERITY_ORDER: Record<string, number> = {
  Critical: 0,
  Major: 1,
  Minor: 2,
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "var(--color-critical)",
  Major: "var(--color-warning)",
  Minor: "var(--color-text-secondary)",
};

const TH_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--color-text-secondary)",
  padding: "10px 12px",
  textAlign: "left",
  whiteSpace: "nowrap",
  background: "var(--color-bg-tertiary)",
  borderBottom: "1px solid var(--color-border)",
};

const TD_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "13px",
  color: "var(--color-text-primary)",
  padding: "10px 12px",
  borderBottom: "1px solid var(--color-border)",
  verticalAlign: "top",
};

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] ?? "var(--color-text-secondary)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontFamily: "var(--font-geist)",
        fontSize: "11px",
        fontWeight: 500,
        color,
      }}
    >
      <span
        style={{
          display: "block",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: color,
        }}
      />
      {severity}
    </span>
  );
}

const PILLAR_LABELS: Record<string, string> = {
  CS: "Conceptual Soundness",
  OA: "Outcomes Analysis",
  OM: "Ongoing Monitoring",
};

function getPillarLabel(elementCode: string): string {
  const prefix = elementCode.slice(0, 2);
  return PILLAR_LABELS[prefix] ?? prefix;
}

export default function GapAnalysisTable({ gaps }: GapAnalysisTableProps) {
  const sorted = useMemo(
    () =>
      [...gaps].sort(
        (a, b) =>
          (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)
      ),
    [gaps]
  );

  if (gaps.length === 0) {
    return (
      <div
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          borderRadius: "2px",
          padding: "32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "13px",
            color: "var(--color-compliant)",
          }}
        >
          No gaps identified — full compliance across all assessed elements.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
        borderRadius: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={TH_STYLE}>Severity</th>
              <th style={TH_STYLE}>Element Code</th>
              <th style={TH_STYLE}>Pillar</th>
              <th style={TH_STYLE}>Description</th>
              <th style={TH_STYLE}>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((gap, i) => (
              <motion.tr
                key={gap.element_code}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                <td style={{ ...TD_STYLE, whiteSpace: "nowrap" }}>
                  <SeverityBadge severity={gap.severity} />
                </td>
                <td style={TD_STYLE}>
                  <div
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono)",
                      fontSize: "11px",
                      color: "var(--color-accent)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {gap.element_code}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-geist)",
                      fontSize: "11px",
                      color: "var(--color-text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {gap.element_name}
                  </div>
                </td>
                <td
                  style={{
                    ...TD_STYLE,
                    fontSize: "12px",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getPillarLabel(gap.element_code)}
                </td>
                <td
                  style={{
                    ...TD_STYLE,
                    maxWidth: "300px",
                    lineHeight: 1.5,
                    fontSize: "12px",
                  }}
                >
                  {gap.description}
                </td>
                <td
                  style={{
                    ...TD_STYLE,
                    maxWidth: "280px",
                    lineHeight: 1.5,
                    fontSize: "12px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {gap.recommendation}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
