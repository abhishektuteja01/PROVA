const ONE_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_LIMIT = 10;

// In-memory store: userId → timestamps of recent requests
// Vercel serverless caveat: resets on cold start — acceptable for Sprint 1
const requestLog = new Map<string, number[]>();

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
  const now = Date.now();
  const windowStart = now - ONE_HOUR_MS;

  const timestamps = (requestLog.get(userId) ?? []).filter(
    (t) => t > windowStart
  );

  if (timestamps.length >= limit) {
    const oldest = Math.min(...timestamps);
    return { allowed: false, resetAt: new Date(oldest + ONE_HOUR_MS) };
  }

  timestamps.push(now);
  // Evict the entry entirely when empty to prevent unbounded Map growth
  if (timestamps.length > 0) {
    requestLog.set(userId, timestamps);
  } else {
    requestLog.delete(userId);
  }
  return { allowed: true };
}
