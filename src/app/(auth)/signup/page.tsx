"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoogleIcon from "@/components/ui/GoogleIcon";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  async function handleGoogleSignUp() {
    setError(null);
    setOauthLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setOauthLoading(false);
    }
  }

  const isDisabled = loading || oauthLoading;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden" }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: `radial-gradient(circle, var(--color-accent-faint) 0%, transparent 65%)`, filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: "400px", height: "400px", borderRadius: "50%", background: `radial-gradient(circle, var(--color-accent-hint) 0%, transparent 65%)`, filter: "blur(72px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, var(--color-text-secondary) 1px, transparent 1px)", backgroundSize: "30px 30px", opacity: 0.07, maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 100%)" }} />
      </div>

      {/* Card */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "40px 44px" }}>

        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "1px", background: `linear-gradient(90deg,transparent,var(--color-accent-medium),transparent)` }} />

        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "14px" }}>
            <svg
              width="32"
              height="32"
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
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: "36px", color: "var(--color-text-primary)", letterSpacing: "0.05em", transform: "translateY(2px)" }}>PROVA</span>
          </Link>
        </div>

        {success ? (
          /* Success state */
          <div>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-compliant-bg)", border: `1px solid var(--color-compliant-border)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <span style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "16px", color: "var(--color-compliant)" }}>✓</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "26px", fontWeight: 400, color: "var(--color-text-primary)", margin: "0 0 10px 0" }}>
              Check your email
            </h1>
            <p style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 28px 0", lineHeight: 1.6 }}>
              We sent a confirmation link to <strong style={{ color: "var(--color-text-primary)" }}>{email}</strong>. Open it to activate your account.
            </p>
            <Link href="/login" className="focus-visible:ring-2 focus-visible:ring-accent" style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-secondary)", textDecoration: "none", transition: "color 0.15s ease" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "28px", fontWeight: 400, color: "var(--color-text-primary)", margin: "0 0 8px 0", lineHeight: 1.2 }}>
              Create account
            </h1>
            <p style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 32px 0" }}>
              Start checking your model documentation today.
            </p>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isDisabled}
              className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontFamily: "var(--font-geist)", fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "11px", cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.5 : 1, transition: "border-color 0.15s ease, opacity 0.15s ease", marginBottom: "20px" }}
              onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.borderColor = "var(--color-text-secondary)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
            >
              <GoogleIcon />
              {oauthLoading ? "Redirecting…" : "Sign up with Google"}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
              <span style={{ fontFamily: "var(--font-geist)", fontSize: "12px", color: "var(--color-text-secondary)" }}>or</span>
              <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Full Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label htmlFor="fullName" style={{ fontFamily: "var(--font-geist)", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  disabled={isDisabled}
                  style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-primary)", background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "11px 14px", outline: "none", transition: "border-color 0.15s ease", opacity: isDisabled ? 0.5 : 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
                />
              </div>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label htmlFor="email" style={{ fontFamily: "var(--font-geist)", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@bank.com"
                  disabled={isDisabled}
                  style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-primary)", background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "11px 14px", outline: "none", transition: "border-color 0.15s ease", opacity: isDisabled ? 0.5 : 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
                />
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label htmlFor="password" style={{ fontFamily: "var(--font-geist)", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isDisabled}
                  style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-primary)", background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "11px 14px", outline: "none", transition: "border-color 0.15s ease", opacity: isDisabled ? 0.5 : 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
                />
              </div>

              {/* Confirm Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label htmlFor="confirmPassword" style={{ fontFamily: "var(--font-geist)", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isDisabled}
                  style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-primary)", background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "11px 14px", outline: "none", transition: "border-color 0.15s ease", opacity: isDisabled ? 0.5 : 1 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
                />
              </div>

              {/* Error */}
              {error && (
                <p style={{ fontFamily: "var(--font-geist)", fontSize: "13px", color: "var(--color-critical)", margin: 0 }}>
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isDisabled}
                className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
                style={{ fontFamily: "var(--font-geist)", fontSize: "14px", fontWeight: 500, color: "var(--color-bg-primary)", background: isDisabled ? "var(--color-accent-muted)" : "var(--color-accent)", border: "none", borderRadius: "0px", padding: "13px", cursor: isDisabled ? "not-allowed" : "pointer", transition: "opacity 0.15s ease", marginTop: "4px" }}
                onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                {loading ? "Creating account…" : "Create account →"}
              </button>
            </form>

            {/* Footer */}
            <p style={{ fontFamily: "var(--font-geist)", fontSize: "13px", color: "var(--color-text-secondary)", margin: "28px 0 0 0", textAlign: "center" }}>
              Already have an account?{" "}
              <Link href="/login" className="focus-visible:ring-2 focus-visible:ring-accent" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
