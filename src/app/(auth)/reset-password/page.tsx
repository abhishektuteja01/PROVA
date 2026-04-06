"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")}/auth/callback?next=/settings`,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden" }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 65%)", filter: "blur(72px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, var(--color-text-secondary) 1px, transparent 1px)", backgroundSize: "30px 30px", opacity: 0.07, maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 100%)" }} />
      </div>

      {/* Card */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "40px 44px" }}>

        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "1px", background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.35),transparent)" }} />

        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: "36px" }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: "40px", color: "var(--color-text-primary)" }}>Prova</span>
        </Link>

        {success ? (
          /* Success state */
          <div>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <span style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "16px", color: "var(--color-accent)" }}>✉</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "26px", fontWeight: 400, color: "var(--color-text-primary)", margin: "0 0 10px 0" }}>
              Check your email
            </h1>
            <p style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 28px 0", lineHeight: 1.6 }}>
              We sent a password reset link to <strong style={{ color: "var(--color-text-primary)" }}>{email}</strong>. The link expires in 1 hour.
            </p>
            <Link href="/login" style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-secondary)", textDecoration: "none", transition: "color 0.15s ease" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "28px", fontWeight: 400, color: "var(--color-text-primary)", margin: "0 0 8px 0", lineHeight: 1.2 }}>
              Reset password
            </h1>
            <p style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 32px 0" }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <label htmlFor="reset-email" style={{ fontFamily: "var(--font-geist)", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@bank.com"
                  disabled={loading}
                  style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-primary)", background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "11px 14px", outline: "none", transition: "border-color 0.15s ease", opacity: loading ? 0.5 : 1 }}
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
                disabled={loading}
                style={{ fontFamily: "var(--font-geist)", fontSize: "14px", fontWeight: 500, color: "var(--color-bg-primary)", background: loading ? "rgba(59,130,246,0.5)" : "var(--color-accent)", border: "none", borderRadius: "0px", padding: "13px", cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.15s ease", marginTop: "4px" }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                {loading ? "Sending…" : "Send reset link →"}
              </button>
            </form>

            {/* Footer */}
            <p style={{ fontFamily: "var(--font-geist)", fontSize: "13px", color: "var(--color-text-secondary)", margin: "28px 0 0 0", textAlign: "center" }}>
              Remembered it?{" "}
              <Link href="/login" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
