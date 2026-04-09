export async function register() {
  if (process.env.NODE_ENV !== "production" || !process.env.SENTRY_DSN) {
    return;
  }

  if (
    process.env.NEXT_RUNTIME === "nodejs" ||
    process.env.NEXT_RUNTIME === "edge"
  ) {
    const { init } = await import("@sentry/nextjs");
    init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.2,
      debug: false,
    });
  }
}
