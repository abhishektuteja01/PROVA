"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { SubmissionListItem } from "@/lib/validation/schemas";
import Card from "@/components/ui/Card";
import { getScoreColor } from "./utils";

interface ScoreProgressionChartProps {
  submissionsByModel: Record<string, SubmissionListItem[]>;
  modelNames: string[];
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)",
        borderRadius: "2px",
        padding: "10px 14px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-ibm-plex-mono)",
          fontSize: "11px",
          color: "var(--color-text-secondary)",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      {payload.map((entry) => (
        <div
          key={entry.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "2px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              color: "var(--color-text-secondary)",
            }}
          >
            {entry.name}:
          </span>
          <span
            style={{
              fontFamily: "var(--font-ibm-plex-mono)",
              fontSize: "12px",
              fontWeight: 600,
              color: entry.color,
            }}
          >
            {Math.round(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

const SECTION_HEADER: React.CSSProperties = {
  fontFamily: "var(--font-playfair)",
  fontSize: "18px",
  fontWeight: 600,
  color: "var(--color-text-primary)",
};

export default function ScoreProgressionChart({
  submissionsByModel,
  modelNames,
}: ScoreProgressionChartProps) {
  const [selectedModel, setSelectedModel] = useState<string>(
    modelNames[0] ?? ""
  );

  if (modelNames.length === 0 || !selectedModel) return null;

  const submissions = submissionsByModel[selectedModel] ?? [];
  const chartData = submissions
    .sort((a, b) => a.version_number - b.version_number)
    .map((s) => ({
      version: `v${s.version_number}`,
      "Final Score": s.final_score,
      CS: s.conceptual_score,
      OA: s.outcomes_score,
      OM: s.monitoring_score,
    }));

  const latestScore =
    submissions.length > 0
      ? submissions[submissions.length - 1].final_score
      : 0;

  return (
    <Card animate delay={0.2}>
      {/* Header + model selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div style={SECTION_HEADER}>Score Progression</div>

        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "12px",
            color: "var(--color-text-primary)",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border)",
            borderRadius: "2px",
            padding: "5px 10px",
            cursor: "pointer",
            maxWidth: "220px",
          }}
        >
          {modelNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              stroke="var(--color-border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="version"
              tick={{
                fontFamily: "var(--font-ibm-plex-mono)",
                fontSize: 10,
                fill: "var(--color-text-secondary)",
              }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{
                fontFamily: "var(--font-ibm-plex-mono)",
                fontSize: 10,
                fill: "var(--color-text-secondary)",
              }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
              width={35}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="Final Score"
              stroke={getScoreColor(latestScore)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="CS"
              stroke="var(--color-accent)"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="OA"
              stroke="var(--color-compliant)"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="OM"
              stroke="var(--color-warning)"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginTop: "12px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Final", color: getScoreColor(latestScore), dashed: false },
          { label: "CS", color: "var(--color-accent)", dashed: true },
          { label: "OA", color: "var(--color-compliant)", dashed: true },
          { label: "OM", color: "var(--color-warning)", dashed: true },
        ].map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <div
              style={{
                width: "16px",
                height: "2px",
                background: item.color,
                borderStyle: item.dashed ? "dashed" : "solid",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-geist)",
                fontSize: "10px",
                color: "var(--color-text-secondary)",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
