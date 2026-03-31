import type { Status } from "@/components/dashboard/utils";

interface BadgeProps {
  status: Status;
}

const STATUS_COLORS: Record<Status, string> = {
  Compliant: "var(--color-compliant)",
  "Needs Improvement": "var(--color-warning)",
  "Critical Gaps": "var(--color-critical)",
};

export default function Badge({ status }: BadgeProps) {
  const color = STATUS_COLORS[status];

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
        whiteSpace: "nowrap",
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
      <span
        style={{
          fontFamily: "var(--font-geist)",
          fontSize: "11px",
          fontWeight: 500,
          color,
          lineHeight: 1,
        }}
      >
        {status}
      </span>
    </span>
  );
}
