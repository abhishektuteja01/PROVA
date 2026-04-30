"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import TextArea from "@/components/ui/TextArea";
import Skeleton from "@/components/ui/Skeleton";
import type {
  DisputeType,
  GapWithId,
  ReassessmentResponse,
} from "@/lib/validation/schemas";

interface DisputeModalProps {
  open: boolean;
  onClose: () => void;
  assessmentId: string;
  gap: GapWithId | null;
  onSuccess: (response: ReassessmentResponse) => void;
}

interface DisputeFormProps {
  assessmentId: string;
  gap: GapWithId;
  onCancel: () => void;
  onSuccess: (response: ReassessmentResponse) => void;
}

const DISPUTE_TYPES: ReadonlyArray<{ value: DisputeType; label: string; help: string }> = [
  {
    value: "false_positive",
    label: "False positive",
    help: "The gap is not actually missing — the document covers this element.",
  },
  {
    value: "wrong_severity",
    label: "Wrong severity",
    help: "The gap exists, but the severity (Critical/Major/Minor) is mis-rated.",
  },
  {
    value: "missing_context",
    label: "Missing context",
    help: "The agent missed context elsewhere in the document that changes the finding.",
  },
];

const RATIONALE_MIN = 10;
const RATIONALE_MAX = 2000;
const RESOLUTION_MAX = 2000;

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-geist)",
  fontSize: "11px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-text-secondary)",
  marginBottom: "8px",
};

const FIELD_HINT_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "11px",
  color: "var(--color-text-secondary)",
  marginTop: "6px",
};

const ERROR_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "12px",
  color: "var(--color-critical)",
  marginTop: "10px",
};

function PendingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          fontFamily: "var(--font-geist)",
          fontSize: "13px",
          color: "var(--color-text-primary)",
        }}
      >
        Re-running the affected pillar with your rationale&hellip;
      </div>
      <div
        style={{
          fontFamily: "var(--font-geist)",
          fontSize: "11px",
          color: "var(--color-text-secondary)",
        }}
      >
        This typically takes 10&ndash;30 seconds.
      </div>
      <Skeleton height={12} style={{ width: "100%" }} />
      <Skeleton height={12} style={{ width: "85%" }} />
      <Skeleton height={12} style={{ width: "92%" }} />
      <Skeleton height={12} style={{ width: "70%" }} />
    </div>
  );
}

function DisputeForm({ assessmentId, gap, onCancel, onSuccess }: DisputeFormProps) {
  const [disputeType, setDisputeType] = useState<DisputeType>("false_positive");
  const [rationale, setRationale] = useState("");
  const [resolution, setResolution] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rationaleValid =
    rationale.trim().length >= RATIONALE_MIN && rationale.length <= RATIONALE_MAX;
  const resolutionValid = resolution.length <= RESOLUTION_MAX;
  const canSubmit = rationaleValid && resolutionValid && !submitting;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_id: assessmentId,
          gap_id: gap.id,
          dispute_type: disputeType,
          reviewer_rationale: rationale.trim(),
          proposed_resolution: resolution.trim() || undefined,
        }),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const body = (await res.json().catch(() => null)) as
        | (ReassessmentResponse & { message?: string })
        | { message?: string }
        | null;

      if (!res.ok) {
        const msg =
          (body && "message" in body && body.message) ||
          "Re-assessment failed. Please try again.";
        setError(msg);
        setSubmitting(false);
        return;
      }

      onSuccess(body as ReassessmentResponse);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitting) {
    return <PendingState />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Gap context */}
      <div
        style={{
          background: "var(--color-bg-tertiary)",
          border: "1px solid var(--color-border)",
          padding: "12px",
          borderRadius: "2px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-ibm-plex-mono)",
            fontSize: "11px",
            color: "var(--color-accent)",
            marginBottom: "4px",
          }}
        >
          {gap.element_code} &middot; {gap.severity}
        </div>
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "12px",
            color: "var(--color-text-primary)",
            lineHeight: 1.5,
          }}
        >
          {gap.description}
        </div>
      </div>

      {/* Dispute type */}
      <div>
        <label style={LABEL_STYLE}>Dispute type</label>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {DISPUTE_TYPES.map((t) => (
            <label
              key={t.value}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                cursor: "pointer",
                padding: "8px 10px",
                border: "1px solid var(--color-border)",
                borderRadius: "2px",
                background:
                  disputeType === t.value
                    ? "color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-tertiary))"
                    : "var(--color-bg-tertiary)",
              }}
            >
              <input
                type="radio"
                name="dispute_type"
                value={t.value}
                checked={disputeType === t.value}
                onChange={() => setDisputeType(t.value)}
                style={{ marginTop: "3px", accentColor: "var(--color-accent)" }}
              />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-geist)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {t.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-geist)",
                    fontSize: "11px",
                    color: "var(--color-text-secondary)",
                    marginTop: "2px",
                    lineHeight: 1.4,
                  }}
                >
                  {t.help}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Rationale */}
      <div>
        <label style={LABEL_STYLE}>Reviewer rationale (required)</label>
        <TextArea
          value={rationale}
          onChange={setRationale}
          placeholder="Explain why you disagree with this finding."
          rows={4}
          maxLength={RATIONALE_MAX}
        />
        <div style={FIELD_HINT_STYLE}>
          {rationale.trim().length}/{RATIONALE_MAX} &middot; minimum {RATIONALE_MIN} characters
        </div>
      </div>

      {/* Proposed resolution */}
      <div>
        <label style={LABEL_STYLE}>Proposed resolution (optional)</label>
        <TextArea
          value={resolution}
          onChange={setResolution}
          placeholder="Suggest how the agent should handle this on re-assessment."
          rows={3}
          maxLength={RESOLUTION_MAX}
        />
      </div>

      {error ? <div style={ERROR_STYLE}>{error}</div> : null}

      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent: "flex-end",
          marginTop: "4px",
        }}
      >
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
          Submit & Re-assess
        </Button>
      </div>
    </div>
  );
}

export default function DisputeModal({
  open,
  onClose,
  assessmentId,
  gap,
  onSuccess,
}: DisputeModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Dispute Finding">
      {gap ? (
        <DisputeForm
          key={gap.id}
          assessmentId={assessmentId}
          gap={gap}
          onCancel={onClose}
          onSuccess={onSuccess}
        />
      ) : null}
    </Modal>
  );
}
