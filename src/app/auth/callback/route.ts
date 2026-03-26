import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Use NEXT_PUBLIC_APP_URL to prevent open-redirect via Host header spoofing.
  // Fall back to origin only in dev when the env var is not set.
  const safeBase = process.env.NEXT_PUBLIC_APP_URL || origin;

  return NextResponse.redirect(new URL("/dashboard", safeBase));
}
