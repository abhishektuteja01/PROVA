"use client";

import { useState, useCallback } from "react";
import type { ComplianceResponse, ModelType } from "@/lib/validation/schemas";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Toast from "@/components/ui/Toast";
import DocumentInput from "@/components/compliance/DocumentInput";
import ComplianceResults from "@/components/compliance/ComplianceResults";

type PageState = "input" | "loading" | "results";

interface ErrorState {
  message: string;
  type: "error" | "warning";
}

export default function CheckPage() {
  const [state, setState] = useState<PageState>("input");
  const [result, setResult] = useState<ComplianceResponse | null>(null);
  const [toast, setToast] = useState<ErrorState | null>(null);

  const handleSubmit = useCallback(
    async (data: {
      modelName: string;
      modelType: ModelType;
      documentText?: string;
      file?: File;
    }) => {
      setState("loading");
      setResult(null);
      setToast(null);

      try {
        let response: Response;

        if (data.file) {
          // File upload — multipart/form-data
          const formData = new FormData();
          formData.append("model_name", data.modelName);
          formData.append("model_type", data.modelType);
          formData.append("file", data.file);
          response = await fetch("/api/compliance", {
            method: "POST",
            body: formData,
          });
        } else {
          // Text paste — JSON
          response = await fetch("/api/compliance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model_name: data.modelName,
              model_type: data.modelType,
              document_text: data.documentText,
            }),
          });
        }

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as {
            message?: string;
            retry_after_seconds?: number;
          } | null;

          if (response.status === 429) {
            const retrySeconds = errorBody?.retry_after_seconds ?? 0;
            const retryMinutes = Math.ceil(retrySeconds / 60);
            setToast({
              message: `Rate limit reached. You can run 10 checks per hour. Resets in ${retryMinutes} minute${retryMinutes !== 1 ? "s" : ""}.`,
              type: "warning",
            });
          } else {
            setToast({
              message:
                errorBody?.message ?? "Something went wrong. Please try again.",
              type: "error",
            });
          }
          setState("input");
          return;
        }

        const body = (await response.json()) as ComplianceResponse;
        setResult(body);
        setState("results");
      } catch {
        setToast({
          message: "Network error. Please check your connection and try again.",
          type: "error",
        });
        setState("input");
      }
    },
    []
  );

  function handleRunAnother() {
    setState("input");
    setResult(null);
  }

  return (
    <main
      style={{
        background: "var(--color-bg-primary)",
        minHeight: "100vh",
        padding: "32px 20px",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Page heading */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {state === "results" ? "Compliance Results" : "New Compliance Check"}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "14px",
              color: "var(--color-text-secondary)",
              margin: "8px 0 0",
            }}
          >
            {state === "results"
              ? "Review your SR 11-7 compliance assessment below."
              : "Submit model documentation for SR 11-7 compliance assessment."}
          </p>
        </div>

        {/* Input form */}
        {state === "input" && (
          <Card animate>
            <DocumentInput onSubmit={handleSubmit} isLoading={false} />
          </Card>
        )}

        {/* Loading skeleton */}
        {state === "loading" && <LoadingSkeleton />}

        {/* Results */}
        {state === "results" && result && (
          <ComplianceResults result={result} onRunAnother={handleRunAnother} />
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={!!toast}
          onClose={() => setToast(null)}
          duration={toast.type === "warning" ? 10000 : 6000}
        />
      )}
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Main score skeleton */}
      <div
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          borderRadius: "2px",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <Skeleton width={180} height={14} />
          <Skeleton width={100} height={24} borderRadius={100} />
        </div>
        <Skeleton
          width={120}
          height={72}
          style={{ marginBottom: "16px" }}
        />
        <Skeleton height={1} style={{ width: "100%", marginBottom: "16px" }} />
        <div style={{ display: "flex", gap: "20px" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton
                width={40}
                height={18}
                style={{ marginBottom: "4px" }}
              />
              <Skeleton width={50} height={10} />
            </div>
          ))}
        </div>
      </div>

      {/* Pillar cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "2px",
              padding: "20px",
            }}
          >
            <Skeleton
              width={140}
              height={10}
              style={{ marginBottom: "12px" }}
            />
            <Skeleton
              width={60}
              height={36}
              style={{ marginBottom: "16px" }}
            />
            <Skeleton height={1} style={{ width: "100%", marginBottom: "12px" }} />
            <div style={{ display: "flex", gap: "12px" }}>
              {[0, 1, 2].map((j) => (
                <Skeleton key={j} width={40} height={16} style={{ flex: 1 }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Gap table skeleton */}
      <div>
        <Skeleton
          width={120}
          height={18}
          style={{ marginBottom: "12px" }}
        />
        <div
          style={{
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
          }}
        >
          <Skeleton height={36} style={{ width: "100%" }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              height={48}
              style={{ width: "100%", opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      </div>

      {/* Analyzing message */}
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "13px",
            color: "var(--color-text-secondary)",
          }}
        >
          Analyzing document against SR 11-7 requirements...
        </div>
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "11px",
            color: "var(--color-text-secondary)",
            opacity: 0.6,
            marginTop: "4px",
          }}
        >
          This typically takes 10–30 seconds
        </div>
      </div>
    </div>
  );
}
