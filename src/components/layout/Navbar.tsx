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

// Paths that belong to the authenticated app shell
const isDashboardPath = (pathname: string) =>
  NAV_LINKS.some(({ href }) => pathname.startsWith(href));

function NavSkeleton() {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}
      aria-hidden="true"
    >
      {[72, 90, 68, 48, 76].map((w, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            width: w,
            height: 10,
            background: "var(--color-bg-tertiary)",
            borderRadius: "2px",
            margin: "0 6px",
          }}
        />
      ))}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

  // Never render on auth pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) return null;

  const isAuthenticated = ready && user !== null;

  // Show skeleton on dashboard paths while session resolves — prevents layout shift
  const showSkeleton = !ready && isDashboardPath(pathname);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch {
      // Sign out failed — user remains authenticated; reset button state
      setSigningOut(false);
    }
  };

  // Full-height link naturally docks its border-bottom to the nav bar edge
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname.startsWith(href);

  const NavLinks = ({ vertical = false }: { vertical?: boolean }) => (
    <>
      {NAV_LINKS.map(({ label, href }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "13px",
              fontWeight: active ? 500 : 400,
              color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              textDecoration: "none",
              padding: vertical ? "12px 20px" : "0 12px",
              display: "flex",
              alignItems: "center",
              height: vertical ? "auto" : "56px",
              borderBottom: vertical
                ? "none"
                : active
                ? "2px solid var(--color-accent)"
                : "2px solid transparent",
              borderLeft: vertical && active ? "2px solid var(--color-accent)" : vertical ? "2px solid transparent" : "none",
              transition: "color 0.15s ease, border-color 0.15s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
          >
            {label}
          </Link>
        );
      })}
    </>
  );

  const SignOutButton = ({ fullWidth = false }: { fullWidth?: boolean }) => (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      style={{
        fontFamily: "var(--font-geist)",
        fontSize: "12px",
        color: signingOut ? "var(--color-text-secondary)" : "var(--color-text-secondary)",
        background: "none",
        border: "1px solid var(--color-border)",
        padding: fullWidth ? "10px 20px" : "4px 12px",
        cursor: signingOut ? "default" : "pointer",
        borderRadius: "2px",
        transition: "color 0.15s ease, border-color 0.15s ease",
        opacity: signingOut ? 0.5 : 1,
        width: fullWidth ? "100%" : "auto",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!signingOut) {
          e.currentTarget.style.color = "var(--color-text-primary)";
          e.currentTarget.style.borderColor = "var(--color-text-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--color-text-secondary)";
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  );

  return (
    <>
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
            gap: "0",
          }}
        >
          {/* Logo */}
          <Link
            href={isAuthenticated ? "/dashboard" : "/"}
            style={{
              textDecoration: "none",
              flexShrink: 0,
              marginRight: "24px",
            }}
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

          {/* Desktop nav — hidden on mobile */}
          <div
            className="hidden md:flex"
            style={{ flex: 1, alignItems: "center", height: "56px" }}
          >
            {showSkeleton && <NavSkeleton />}
            {isAuthenticated && (
              <>
                <div
                  style={{
                    width: "1px",
                    height: "16px",
                    background: "var(--color-border)",
                    marginRight: "8px",
                    flexShrink: 0,
                  }}
                />
                <NavLinks />
              </>
            )}
          </div>

          {/* Desktop right side */}
          {isAuthenticated && (
            <div
              className="hidden md:flex"
              style={{
                alignItems: "center",
                gap: "16px",
                marginLeft: "auto",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-ibm-plex-mono)",
                  fontSize: "11px",
                  color: "var(--color-text-secondary)",
                  opacity: 0.55,
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </span>
              <SignOutButton />
            </div>
          )}

          {/* Mobile hamburger — shown only when authenticated */}
          {(isAuthenticated || showSkeleton) && (
            <button
              className="flex md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: "var(--color-text-secondary)",
              }}
            >
              {menuOpen ? (
                // ✕ close icon
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="3" y1="3" x2="15" y2="15" />
                  <line x1="15" y1="3" x2="3" y2="15" />
                </svg>
              ) : (
                // ≡ hamburger icon
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="2" y1="5" x2="16" y2="5" />
                  <line x1="2" y1="9" x2="16" y2="9" />
                  <line x1="2" y1="13" x2="16" y2="13" />
                </svg>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && isAuthenticated && (
        <div
          className="md:hidden"
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            borderBottom: "1px solid var(--color-border)",
            position: "sticky",
            top: "56px",
            zIndex: 49,
          }}
        >
          <NavLinks vertical />
          <div
            style={{
              padding: "12px 20px 16px",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-ibm-plex-mono)",
                fontSize: "11px",
                color: "var(--color-text-secondary)",
                opacity: 0.55,
              }}
            >
              {user.email}
            </span>
            <SignOutButton fullWidth />
          </div>
        </div>
      )}
    </>
  );
}
