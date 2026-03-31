"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { SubmissionListItem } from "@/lib/validation/schemas";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { getScoreColor, getStatusFromScore, timeAgo } from "./utils";

interface RecentActivityFeedProps {
  submissions: SubmissionListItem[];
}

const SECTION_HEADER: React.CSSProperties = {
  fontFamily: "var(--font-playfair)",
  fontSize: "18px",
  fontWeight: 600,
  color: "var(--color-text-primary)",
  marginBottom: "16px",
};

export default function RecentActivityFeed({
  submissions,
}: RecentActivityFeedProps) {
  if (submissions.length === 0) {
    return (
      <Card animate delay={0.3}>
        <div style={SECTION_HEADER}>Recent Activity</div>
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              marginBottom: "12px",
            }}
          >
            No recent activity
          </div>
          <Link
            href="/check"
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            Run your first compliance check &rarr;
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card animate delay={0.3}>
      <div style={SECTION_HEADER}>Recent Activity</div>
      <div>
        {submissions.map((sub, i) => (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.1 + i * 0.04,
            }}
          >
            <Link
              href={`/submissions/${sub.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "12px 0",
                textDecoration: "none",
                borderBottom:
                  i < submissions.length - 1
                    ? "1px solid var(--color-border)"
                    : "none",
              }}
            >
              {/* Left: model name + version */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-geist)",
                    fontSize: "13px",
                    color: "var(--color-text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sub.model_name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono)",
                    fontSize: "10px",
                    color: "var(--color-text-secondary)",
                    background: "var(--color-bg-tertiary)",
                    padding: "2px 6px",
                    borderRadius: "2px",
                    flexShrink: 0,
                  }}
                >
                  v{sub.version_number}
                </span>
              </div>

              {/* Center: score */}
              <span
                style={{
                  fontFamily: "var(--font-ibm-plex-mono)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: getScoreColor(sub.final_score),
                  flexShrink: 0,
                }}
              >
                {Math.round(sub.final_score)}
              </span>

              {/* Status badge — hidden on small screens */}
              <div style={{ flexShrink: 0 }} className="hidden sm:block">
                <Badge status={getStatusFromScore(sub.final_score)} />
              </div>

              {/* Right: timestamp */}
              <span
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "11px",
                  color: "var(--color-text-secondary)",
                  flexShrink: 0,
                  minWidth: "60px",
                  textAlign: "right",
                }}
              >
                {timeAgo(sub.created_at)}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
