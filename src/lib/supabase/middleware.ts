import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  // ── I9: CSRF Origin check for state-changing requests to API routes ──
  if (isApiRoute && STATE_CHANGING_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;

    // If Origin header is present and does not match the app URL, block the request.
    // If Origin is missing we allow through (some legitimate clients omit it).
    if (origin && allowedOrigin) {
      // Strip trailing slashes for comparison
      const normalise = (url: string) => url.replace(/\/+$/, "");
      if (normalise(origin) !== normalise(allowedOrigin)) {
        return NextResponse.json(
          { error: "Forbidden", message: "Cross-origin request blocked." },
          { status: 403 }
        );
      }
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not add any logic between createServerClient and
  // getUser. A stale session causes auth bugs that are hard to debug.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api/health");

  if (!user && !isPublicPath) {
    // ── I3: API routes get 401 JSON instead of redirect ──
    if (isApiRoute) {
      return NextResponse.json(
        {
          error: "AUTH_REQUIRED",
          error_code: "AUTH_REQUIRED",
          message: "Your session has expired. Please log in again.",
        },
        { status: 401 }
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
