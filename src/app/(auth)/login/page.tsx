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
  const [oauthLoading, setOauthLoading] = useState(false);
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

  async function handleGoogleSignIn() {
    setError(null);
    setOauthLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setOauthLoading(false);
    }
    // On success, browser is redirected by Supabase — no manual push needed
  }

  const isDisabled = loading || oauthLoading;

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

        {/* Heading */}
        <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "28px", fontWeight: 400, color: "var(--color-text-primary)", margin: "0 0 8px 0", lineHeight: 1.2 }}>
          Sign in
        </h1>
        <p style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 32px 0" }}>
          Continue to your compliance dashboard.
        </p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isDisabled}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontFamily: "var(--font-geist)", fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "11px", cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.5 : 1, transition: "border-color 0.15s ease, opacity 0.15s ease", marginBottom: "20px" }}
          onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.borderColor = "var(--color-text-secondary)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
        >
          <GoogleIcon />
          {oauthLoading ? "Redirecting…" : "Sign in with Google"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
          <span style={{ fontFamily: "var(--font-geist)", fontSize: "12px", color: "var(--color-text-secondary)" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
        </div>

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
              disabled={isDisabled}
              style={{ fontFamily: "var(--font-geist)", fontSize: "14px", color: "var(--color-text-primary)", background: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "11px 14px", outline: "none", transition: "border-color 0.15s ease", opacity: isDisabled ? 0.5 : 1 }}
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
            style={{ fontFamily: "var(--font-geist)", fontSize: "14px", fontWeight: 500, color: "var(--color-bg-primary)", background: isDisabled ? "rgba(59,130,246,0.5)" : "var(--color-accent)", border: "none", borderRadius: "0px", padding: "13px", cursor: isDisabled ? "not-allowed" : "pointer", transition: "opacity 0.15s ease", marginTop: "4px" }}
            onMouseEnter={e => { if (!isDisabled) e.currentTarget.style.opacity = "0.85"; }}
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

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
