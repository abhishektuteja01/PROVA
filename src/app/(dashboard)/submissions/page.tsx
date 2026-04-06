"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { SubmissionListItem } from "@/lib/validation/schemas";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Toast from "@/components/ui/Toast";
import { getScoreColor } from "@/components/dashboard/utils";
import type { Status } from "@/components/dashboard/utils";

// ─── Style constants (matching ModelInventoryTable / GapAnalysisTable) ────────

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

// ─── API response shape ──────────────────────────────────────────────────────

interface SubmissionsResponse {
  data: SubmissionListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function SubmissionsLoadingSkeleton() {
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "14px 20px",
          background: "var(--color-bg-tertiary)",
          display: "flex",
          gap: "40px",
        }}
      >
        {[120, 50, 80, 60, 100, 70].map((w, i) => (
          <Skeleton key={i} width={w} height={10} />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "40px",
            padding: "12px 20px",
            borderBottom: "1px solid var(--color-border)",
            opacity: 1 - i * 0.12,
          }}
        >
          <Skeleton width={140} height={13} />
          <Skeleton width={30} height={13} />
          <Skeleton width={80} height={13} />
          <Skeleton width={30} height={13} />
          <Skeleton width={90} height={20} borderRadius={100} />
          <Skeleton width={80} height={13} />
        </div>
      ))}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <Skeleton width={140} height={12} />
        <div style={{ display: "flex", gap: "8px" }}>
          <Skeleton width={50} height={24} />
          <Skeleton width={50} height={24} />
        </div>
      </div>
    </Card>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <Card animate delay={0.06}>
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "13px",
            color: "var(--color-text-secondary)",
            marginBottom: "12px",
          }}
        >
          No submissions yet — run your first compliance check.
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

// ─── Main page component ─────────────────────────────────────────────────────

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [deleteModal, setDeleteModal] = useState<
    | { type: "single"; id: string; modelName: string }
    | { type: "all" }
    | null
  >(null);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Fetch paginated submissions
  const fetchSubmissions = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions?page=${p}&limit=10`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setToast({
          message: body?.message ?? "Failed to load submissions.",
          type: "error",
        });
        setLoading(false);
        return;
      }
      const json = (await res.json()) as SubmissionsResponse;
      setSubmissions(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
      setPage(json.page);
    } catch {
      setToast({
        message: "Network error. Please check your connection.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions(1);
  }, [fetchSubmissions]);

  // Delete single submission
  const handleDeleteSingle = useCallback(
    async (id: string) => {
      setDeleting(true);
      try {
        const res = await fetch(`/api/submissions/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            message?: string;
          } | null;
          setToast({
            message: body?.message ?? "Failed to delete submission.",
            type: "error",
          });
          return;
        }
        setToast({ message: "Submission deleted.", type: "success" });
        setDeleteModal(null);
        // If last item on current page, go back one page
        const targetPage =
          submissions.length === 1 && page > 1 ? page - 1 : page;
        await fetchSubmissions(targetPage);
      } catch {
        setToast({
          message: "Network error. Please try again.",
          type: "error",
        });
      } finally {
        setDeleting(false);
      }
    },
    [fetchSubmissions, page, submissions.length]
  );

  // Delete all submissions
  const handleDeleteAll = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setToast({
          message: body?.message ?? "Failed to delete history.",
          type: "error",
        });
        return;
      }
      setToast({ message: "All submission history deleted.", type: "success" });
      setDeleteModal(null);
      setDeleteAllConfirmText("");
      await fetchSubmissions(1);
    } catch {
      setToast({
        message: "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  }, [fetchSubmissions]);

  const showingStart = total > 0 ? (page - 1) * 10 + 1 : 0;
  const showingEnd = Math.min(page * 10, total);

  return (
    <main
      style={{
        background: "var(--color-bg-primary)",
        minHeight: "100vh",
        padding: "32px 20px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "0 0 6px 0",
                lineHeight: 1.2,
              }}
            >
              Submission History
            </h1>
            <p
              style={{
                fontFamily: "var(--font-geist)",
                fontSize: "14px",
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              Review and manage your compliance check history.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={total === 0 || loading}
            onClick={() => setDeleteModal({ type: "all" })}
            style={{
              color: "var(--color-critical)",
              borderColor:
                "color-mix(in srgb, var(--color-critical) 40%, transparent)",
            }}
          >
            Delete All History
          </Button>
        </div>

        {/* Loading skeleton */}
        {loading && <SubmissionsLoadingSkeleton />}

        {/* Empty state */}
        {!loading && submissions.length === 0 && <EmptyState />}

        {/* Table */}
        {!loading && submissions.length > 0 && (
          <Card
            animate
            delay={0.06}
            style={{ padding: 0, overflow: "hidden" }}
          >
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
                    <th style={TH_STYLE}>Model Name</th>
                    <th style={TH_STYLE}>Version</th>
                    <th style={TH_STYLE}>Date</th>
                    <th style={TH_STYLE}>Final Score</th>
                    <th style={TH_STYLE}>Status</th>
                    <th style={TH_STYLE}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, i) => (
                    <motion.tr
                      key={sub.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                      style={{ background: "transparent" }}
                    >
                      <td
                        style={{
                          ...TD_STYLE,
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {sub.model_name}
                      </td>
                      <td style={{ ...TD_STYLE, ...MONO_CELL }}>
                        v{sub.version_number}
                      </td>
                      <td
                        style={{
                          ...TD_STYLE,
                          fontSize: "12px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {formatDate(sub.created_at)}
                      </td>
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
                      <td style={TD_STYLE}>
                        <Badge status={sub.status as Status} />
                      </td>
                      <td style={TD_STYLE}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
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
                            onClick={() =>
                              setDeleteModal({
                                type: "single",
                                id: sub.id,
                                modelName: sub.model_name,
                              })
                            }
                            style={{
                              fontFamily: "var(--font-geist)",
                              fontSize: "11px",
                              padding: "2px 6px",
                              color: "var(--color-critical)",
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
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
                Showing {showingStart}&ndash;{showingEnd} of {total}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchSubmissions(page - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => fetchSubmissions(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Delete single modal */}
        <Modal
          open={deleteModal?.type === "single"}
          onClose={() => setDeleteModal(null)}
          title="Delete Submission"
        >
          <p
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              margin: "0 0 6px 0",
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to delete the submission for{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {deleteModal?.type === "single" ? deleteModal.modelName : ""}
            </strong>
            ?
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            This action cannot be undone.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "20px",
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="ghost"
              onClick={() => setDeleteModal(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (deleteModal?.type === "single") {
                  handleDeleteSingle(deleteModal.id);
                }
              }}
              disabled={deleting}
              style={{
                background: "var(--color-critical)",
                borderColor: "var(--color-critical)",
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </Modal>

        {/* Delete all modal */}
        <Modal
          open={deleteModal?.type === "all"}
          onClose={() => {
            setDeleteModal(null);
            setDeleteAllConfirmText("");
          }}
          title="Delete All History"
        >
          <p
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              margin: "0 0 12px 0",
              lineHeight: 1.5,
            }}
          >
            This will permanently delete all{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {total}
            </strong>{" "}
            submission{total !== 1 ? "s" : ""}. This action cannot be undone.
          </p>
          <p
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "12px",
              color: "var(--color-text-secondary)",
              margin: "0 0 8px 0",
            }}
          >
            Type <strong style={{ color: "var(--color-text-primary)" }}>DELETE</strong>{" "}
            to confirm:
          </p>
          <input
            type="text"
            value={deleteAllConfirmText}
            onChange={(e) => setDeleteAllConfirmText(e.target.value)}
            placeholder="DELETE"
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "12px",
              color: "var(--color-text-primary)",
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              borderRadius: "2px",
              padding: "8px 12px",
              width: "100%",
              outline: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "20px",
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteModal(null);
                setDeleteAllConfirmText("");
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteAll}
              disabled={deleting || deleteAllConfirmText !== "DELETE"}
              style={{
                background: "var(--color-critical)",
                borderColor: "var(--color-critical)",
              }}
            >
              {deleting ? "Deleting..." : "Delete All"}
            </Button>
          </div>
        </Modal>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            visible={!!toast}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </main>
  );
}
