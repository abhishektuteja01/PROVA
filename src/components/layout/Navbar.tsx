"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const AUTH_PATHS = ["/login", "/signup", "/reset-password"];

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "New Check", href: "/check" },
  { label: "History", href: "/submissions" },
  { label: "Help", href: "/help" },
  { label: "Settings", href: "/settings" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Never show on auth pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) return null;

  const isAuthenticated = ready && user !== null;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // Active when pathname exactly matches or is a sub-route
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <nav
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 20px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          gap: "32px",
        }}
      >
        {/* Logo */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}
        >
          <span
            style={{
              fontFamily: "var(--font-ibm-plex-mono)",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: "var(--color-text-primary)",
            }}
          >
            PROVA
          </span>
        </Link>

        {/* Nav links — authenticated only */}
        {isAuthenticated && (
          <>
            <div
              style={{
                width: "1px",
                height: "16px",
                background: "var(--color-border)",
                flexShrink: 0,
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "2px", flex: 1 }}>
              {NAV_LINKS.map(({ label, href }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      fontFamily: "var(--font-geist)",
                      fontSize: "13px",
                      fontWeight: active ? 500 : 400,
                      color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                      textDecoration: "none",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      position: "relative",
                      transition: "color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.color = "var(--color-text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.color = "var(--color-text-secondary)";
                    }}
                  >
                    {label}
                    {active && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "-1px",
                          left: "12px",
                          right: "12px",
                          height: "1px",
                          background: "var(--color-accent)",
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side — user email + sign out */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-ibm-plex-mono)",
                  fontSize: "11px",
                  color: "var(--color-text-secondary)",
                  opacity: 0.6,
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  background: "none",
                  border: "1px solid var(--color-border)",
                  padding: "4px 12px",
                  cursor: "pointer",
                  borderRadius: "3px",
                  transition: "color 0.15s ease, border-color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-text-primary)";
                  e.currentTarget.style.borderColor = "var(--color-text-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                }}
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
