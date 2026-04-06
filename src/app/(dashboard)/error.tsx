"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-geist)",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "420px" }}>
        <h1
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "24px",
            color: "var(--color-text-primary)",
            marginBottom: "12px",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--color-text-secondary)",
            marginBottom: "24px",
            lineHeight: 1.6,
          }}
        >
          {error.message || "An unexpected error occurred while loading the dashboard."}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            fontSize: "13px",
            fontFamily: "var(--font-geist)",
            color: "var(--color-bg-primary)",
            background: "var(--color-text-primary)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
