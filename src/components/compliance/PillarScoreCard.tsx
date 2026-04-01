"use client";

import { motion } from "framer-motion";
import { getScoreColor } from "@/components/dashboard/utils";

interface PillarScoreCardProps {
  pillarName: string;
  weight: string;
  score: number;
  gapCounts: { critical: number; major: number; minor: number };
  delay?: number;
}

export default function PillarScoreCard({
  pillarName,
  weight,
  score,
  gapCounts,
  delay = 0,
}: PillarScoreCardProps) {
  const color = getScoreColor(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
      style={{
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
        borderRadius: "2px",
        padding: "20px",
      }}
    >
      {/* Pillar name + weight */}
      <div
        style={{
          fontFamily: "var(--font-geist)",
          fontSize: "11px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-text-secondary)",
          marginBottom: "12px",
        }}
      >
        {pillarName}{" "}
        <span style={{ opacity: 0.5 }}>&middot; {weight}</span>
      </div>

      {/* Score */}
      <div
        style={{
          fontFamily: "var(--font-ibm-plex-mono)",
          fontSize: "36px",
          fontWeight: 600,
          lineHeight: 1,
          color,
          marginBottom: "16px",
        }}
      >
        {Math.round(score)}
      </div>

      {/* Gap counts */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          borderTop: "1px solid var(--color-border)",
          paddingTop: "12px",
        }}
      >
        {[
          { label: "Critical", count: gapCounts.critical, color: "var(--color-critical)" },
          { label: "Major", count: gapCounts.major, color: "var(--color-warning)" },
          { label: "Minor", count: gapCounts.minor, color: "var(--color-text-secondary)" },
        ].map((item) => (
          <div key={item.label} style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-ibm-plex-mono)",
                fontSize: "16px",
                fontWeight: 600,
                color: item.count > 0 ? item.color : "var(--color-text-secondary)",
                marginBottom: "2px",
              }}
            >
              {item.count}
            </div>
            <div
              style={{
                fontFamily: "var(--font-geist)",
                fontSize: "10px",
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
