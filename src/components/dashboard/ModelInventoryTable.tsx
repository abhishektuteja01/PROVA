"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { SubmissionListItem } from "@/lib/validation/schemas";
import type { Status } from "./utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Toast from "@/components/ui/Toast";
import { getScoreColor, getStatusFromScore } from "./utils";

interface ModelInventoryTableProps {
  submissions: SubmissionListItem[];
}

type SortField =
  | "model_name"
  | "version_number"
  | "created_at"
  | "conceptual_score"
  | "outcomes_score"
  | "monitoring_score"
  | "final_score"
  | "status";

const PAGE_SIZE = 10;

const COLUMNS: { key: SortField; label: string; mono?: boolean }[] = [
  { key: "model_name", label: "Model Name" },
  { key: "version_number", label: "Version", mono: true },
  { key: "created_at", label: "Submission Date" },
  { key: "conceptual_score", label: "CS", mono: true },
  { key: "outcomes_score", label: "OA", mono: true },
  { key: "monitoring_score", label: "OM", mono: true },
  { key: "final_score", label: "Final", mono: true },
];

const STATUS_ORDER: Record<string, number> = {
  Compliant: 0,
  "Needs Improvement": 1,
  "Critical Gaps": 2,
};

const INPUT_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "12px",
  color: "var(--color-text-primary)",
  background: "var(--color-bg-tertiary)",
  border: "1px solid var(--color-border)",
  borderRadius: "2px",
  padding: "5px 10px",
};

/** Parse a YYYY-MM-DD string to a Date at midnight local */
function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

const SECTION_HEADER: React.CSSProperties = {
  fontFamily: "var(--font-playfair)",
  fontSize: "18px",
  fontWeight: 600,
  color: "var(--color-text-primary)",
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
  cursor: "pointer",
  userSelect: "none",
  background: "var(--color-bg-tertiary)",
  borderBottom: "1px solid var(--color-border)",
};

const TD_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "13px",
  color: "var(--color-text-primary)",
  padding: "10px 12px",
  borderBottom: "1px solid var(--color-border)",
  whiteSpace: "nowrap",
};

const MONO_CELL: React.CSSProperties = {
  fontFamily: "var(--font-ibm-plex-mono)",
  fontSize: "13px",
  fontWeight: 500,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ModelInventoryTable({
  submissions,
}: ModelInventoryTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [page, setPage] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const handleDownloadReport = async (submissionId: string) => {
    setDownloadingId(submissionId);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId }),
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
      setToast({ message: "Failed to generate report. Please try again.", type: "error" });
    } finally {
      setDownloadingId(null);
    }
  };

  const processed = useMemo(() => {
    let filtered = submissions.map((s) => ({
      ...s,
      status: getStatusFromScore(s.final_score),
    }));

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Date range filter
    const fromDate = parseDateInput(dateFrom);
    const toDate = parseDateInput(dateTo);
    if (fromDate) {
      filtered = filtered.filter((s) => new Date(s.created_at) >= fromDate);
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter((s) => new Date(s.created_at) <= endOfDay);
    }

    // Score range filter
    const minScore = scoreMin !== "" ? Number(scoreMin) : null;
    const maxScore = scoreMax !== "" ? Number(scoreMax) : null;
    if (minScore !== null && !isNaN(minScore)) {
      filtered = filtered.filter((s) => s.final_score >= minScore);
    }
    if (maxScore !== null && !isNaN(maxScore)) {
      filtered = filtered.filter((s) => s.final_score <= maxScore);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortField === "status") {
        const aOrd = STATUS_ORDER[a.status] ?? 3;
        const bOrd = STATUS_ORDER[b.status] ?? 3;
        return sortDir === "asc" ? aOrd - bOrd : bOrd - aOrd;
      }

      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return filtered;
  }, [submissions, sortField, sortDir, statusFilter, dateFrom, dateTo, scoreMin, scoreMax]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageData = processed.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE
  );
  const showingStart = processed.length > 0 ? safePage * PAGE_SIZE + 1 : 0;
  const showingEnd = Math.min((safePage + 1) * PAGE_SIZE, processed.length);

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  }

  function handleStatusFilter(value: string) {
    setStatusFilter(value as Status | "all");
    setPage(0);
  }

  function handleDateFrom(value: string) {
    setDateFrom(value);
    setPage(0);
  }

  function handleDateTo(value: string) {
    setDateTo(value);
    setPage(0);
  }

  function handleScoreMin(value: string) {
    setScoreMin(value);
    setPage(0);
  }

  function handleScoreMax(value: string) {
    setScoreMax(value);
    setPage(0);
  }

  if (submissions.length === 0) {
    return (
      <Card animate delay={0.12}>
        <div style={SECTION_HEADER}>Model Inventory</div>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              marginBottom: "12px",
            }}
          >
            No models assessed yet — run your first compliance check.
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
            Start a compliance check &rarr;
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <>
    <Card animate delay={0.12} style={{ padding: 0, overflow: "hidden" }}>
      {/* Header + Filters */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          padding: "20px 20px 8px",
        }}
      >
        <div style={SECTION_HEADER}>Model Inventory</div>
      </div>

      {/* Filter row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          padding: "0 20px 16px",
        }}
      >
        {/* Status filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              color: "var(--color-text-secondary)",
            }}
          >
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            style={{ ...INPUT_STYLE, cursor: "pointer" }}
          >
            <option value="all">All</option>
            <option value="Compliant">Compliant</option>
            <option value="Needs Improvement">Needs Improvement</option>
            <option value="Critical Gaps">Critical Gaps</option>
          </select>
        </div>

        {/* Date range filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              color: "var(--color-text-secondary)",
            }}
          >
            Date:
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFrom(e.target.value)}
            style={{ ...INPUT_STYLE, width: "130px" }}
            aria-label="Date from"
          />
          <span
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              color: "var(--color-text-secondary)",
            }}
          >
            –
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateTo(e.target.value)}
            style={{ ...INPUT_STYLE, width: "130px" }}
            aria-label="Date to"
          />
        </div>

        {/* Score range filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              color: "var(--color-text-secondary)",
            }}
          >
            Score:
          </label>
          <input
            type="number"
            min={0}
            max={100}
            placeholder="Min"
            value={scoreMin}
            onChange={(e) => handleScoreMin(e.target.value)}
            style={{ ...INPUT_STYLE, width: "64px" }}
            aria-label="Minimum score"
          />
          <span
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              color: "var(--color-text-secondary)",
            }}
          >
            –
          </span>
          <input
            type="number"
            min={0}
            max={100}
            placeholder="Max"
            value={scoreMax}
            onChange={(e) => handleScoreMax(e.target.value)}
            style={{ ...INPUT_STYLE, width: "64px" }}
            aria-label="Maximum score"
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            borderRadius: 0,
          }}
        >
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  style={TH_STYLE}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortField === col.key && (
                    <span style={{ marginLeft: "4px", fontSize: "9px" }}>
                      {sortDir === "asc" ? "\u25B2" : "\u25BC"}
                    </span>
                  )}
                </th>
              ))}
              <th
                style={TH_STYLE}
                onClick={() => handleSort("status")}
              >
                Status
                {sortField === "status" && (
                  <span style={{ marginLeft: "4px", fontSize: "9px" }}>
                    {sortDir === "asc" ? "\u25B2" : "\u25BC"}
                  </span>
                )}
              </th>
              <th style={{ ...TH_STYLE, cursor: "default" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((sub, i) => {
              const status = getStatusFromScore(sub.final_score);
              return (
                <motion.tr
                  key={sub.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  style={{ background: "transparent" }}
                >
                  {/* Model Name */}
                  <td
                    style={{
                      ...TD_STYLE,
                      maxWidth: "180px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {sub.model_name}
                  </td>

                  {/* Version */}
                  <td style={{ ...TD_STYLE, ...MONO_CELL }}>
                    v{sub.version_number}
                  </td>

                  {/* Submission Date */}
                  <td
                    style={{
                      ...TD_STYLE,
                      fontFamily: "var(--font-geist)",
                      fontSize: "12px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {formatDate(sub.created_at)}
                  </td>

                  {/* CS Score */}
                  <td
                    style={{
                      ...TD_STYLE,
                      ...MONO_CELL,
                      color: getScoreColor(sub.conceptual_score),
                    }}
                  >
                    {Math.round(sub.conceptual_score)}
                  </td>

                  {/* OA Score */}
                  <td
                    style={{
                      ...TD_STYLE,
                      ...MONO_CELL,
                      color: getScoreColor(sub.outcomes_score),
                    }}
                  >
                    {Math.round(sub.outcomes_score)}
                  </td>

                  {/* OM Score */}
                  <td
                    style={{
                      ...TD_STYLE,
                      ...MONO_CELL,
                      color: getScoreColor(sub.monitoring_score),
                    }}
                  >
                    {Math.round(sub.monitoring_score)}
                  </td>

                  {/* Final Score */}
                  <td
                    style={{
                      ...TD_STYLE,
                      ...MONO_CELL,
                      fontWeight: 600,
                      color: getScoreColor(sub.final_score),
                    }}
                  >
                    {Math.round(sub.final_score)}
                  </td>

                  {/* Status */}
                  <td style={TD_STYLE}>
                    <Badge status={status} />
                  </td>

                  {/* Actions */}
                  <td style={TD_STYLE}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <Link
                        href={`/submissions/${sub.id}`}
                        style={{
                          fontFamily: "var(--font-geist)",
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "var(--color-accent)",
                          textDecoration: "none",
                        }}
                      >
                        View
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={downloadingId === sub.id}
                        onClick={() => handleDownloadReport(sub.id)}
                        style={{
                          fontFamily: "var(--font-geist)",
                          fontSize: "11px",
                          padding: "2px 6px",
                        }}
                      >
                        {downloadingId === sub.id ? "…" : "Report"}
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "12px",
            color: "var(--color-text-secondary)",
          }}
        >
          {processed.length > 0
            ? `Showing ${showingStart}–${showingEnd} of ${processed.length}`
            : "No results"}
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
    {toast && (
      <Toast
        visible
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(null)}
      />
    )}
    </>
  );
}
