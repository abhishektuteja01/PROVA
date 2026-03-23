"use client";

import { usePathname } from "next/navigation";

const AUTH_PATHS = ["/login", "/signup", "/reset-password"];

export default function Navbar() {
  const pathname = usePathname();

  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--color-border)",
        backgroundColor: "var(--color-bg-secondary)",
      }}
      className="px-6 py-4"
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-primary)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M9 16.5V9h4.5a2.5 2.5 0 0 1 0 5H9" />
          <line x1="6" y1="11.5" x2="9" y2="11.5" />
          <line x1="6" y1="14" x2="13.5" y2="14" />
          <line x1="9" y1="20" x2="9" y2="16.5" />
          <line x1="13.5" y1="16.5" x2="13.5" y2="20" />
        </svg>
        <span
          style={{ fontFamily: "var(--font-instrument-serif)", color: "var(--color-text-primary)", letterSpacing: "0.05em", transform: "translateY(1px)" }}
          className="text-xl"
        >
          PROVA
        </span>
      </div>
    </nav>
  );
}
