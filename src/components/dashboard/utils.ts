import type { z } from "zod";
import type { StatusEnum } from "@/lib/validation/schemas";

export type Status = z.infer<typeof StatusEnum>;

/**
 * Returns the CSS variable string for a score's status color.
 * Matches the pattern from LandingAnimations.tsx.
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "var(--color-compliant)";
  if (score >= 60) return "var(--color-warning)";
  return "var(--color-critical)";
}

/**
 * Derives compliance status from a numeric score.
 * Thresholds: >=80 Compliant, >=60 Needs Improvement, <60 Critical Gaps.
 */
export function getStatusFromScore(score: number): Status {
  if (score >= 80) return "Compliant";
  if (score >= 60) return "Needs Improvement";
  return "Critical Gaps";
}

/**
 * Returns a human-readable relative timestamp string.
 * Uses simple math — no external dependency.
 */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
