"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
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
          <span style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "22px", color: "var(--color-text-primary)" }}>Prova</span>
        </Link>

        {/* Heading */}
        <h1 style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "28px", fontWeight: 400, color: "var(--color-text-primary)", margin: "0 0 8px 0", lineHeight: 1.2 }}>
          Sign in
        </h1>
        <p style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 32px 0" }}>
          Continue to your compliance dashboard.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <label style={{ fontFamily: "var(--font-geist)", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@bank.com"
              style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-primary)", background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "11px 14px", outline: "none", transition: "border-color 0.15s ease" }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontFamily: "var(--font-geist)", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Password
              </label>
              <Link href="/reset-password" style={{ fontFamily: "var(--font-geist)", fontSize: "12px", color: "var(--color-text-secondary)", textDecoration: "none", transition: "color 0.15s ease" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text-primary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-secondary)")}
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-primary)", background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "11px 14px", outline: "none", transition: "border-color 0.15s ease" }}
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
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        {/* Footer */}
        <p style={{ fontFamily: "var(--font-geist)", fontSize: "13px", color: "var(--color-text-secondary)", margin: "28px 0 0 0", textAlign: "center" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
