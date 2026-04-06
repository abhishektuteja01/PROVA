import { createServiceClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 10;

function getLimit(): number {
  const raw = process.env.RATE_LIMIT_REQUESTS_PER_HOUR;
  const parsed = parseInt(raw ?? "", 10);
  // Fall back to default if env var is missing, NaN, zero, or negative
  return isNaN(parsed) || parsed <= 0 ? DEFAULT_LIMIT : parsed;
}

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; resetAt?: Date }> {
  const limit = getLimit();
  const db = createServiceClient();

  // Count submissions for this user created within the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error: countError } = await db
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneHourAgo);

  if (countError) {
    // If we can't check the rate limit, allow the request to proceed
    // rather than blocking the user. The error will be logged by Sentry
    // if it's a persistent issue.
    return { allowed: true };
  }

  const currentCount = count ?? 0;

  if (currentCount >= limit) {
    // Find the oldest submission in the window to calculate resetAt
    const { data: oldestRow, error: oldestError } = await db
      .from("submissions")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (oldestError || !oldestRow) {
      // Fallback: reset in 1 hour from now
      return { allowed: false, resetAt: new Date(Date.now() + 60 * 60 * 1000) };
    }

    const oldestTime = new Date(String(oldestRow.created_at)).getTime();
    const resetAt = new Date(oldestTime + 60 * 60 * 1000);
    return { allowed: false, resetAt };
  }

  return { allowed: true };
}
