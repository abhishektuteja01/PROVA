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
      <span
        style={{ fontFamily: "var(--font-instrument-serif)", color: "var(--color-text-primary)" }}
        className="text-lg"
      >
        Prova
      </span>
    </nav>
  );
}
