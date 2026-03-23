import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Session-aware client — uses anon key, respects RLS
// Use this in API routes and Server Components for user-scoped reads
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — cookies are read-only.
            // Middleware handles session refresh in that case.
          }
        },
      },
    }
  );
}

// Service role client — bypasses RLS
// Use this ONLY for server-side writes (inserting submissions, gaps, evals)
// SUPABASE_SECRET_KEY must never appear in any other file
export function createServiceClient() {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
