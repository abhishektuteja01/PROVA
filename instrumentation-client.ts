import * as Sentry from "@sentry/nextjs";

// Client-side Sentry initialisation.
//
// This file MUST be named instrumentation-client.ts. It was previously
// sentry.client.config.ts, which Turbopack does not load — and Next.js 16
// builds with Turbopack by default, so client-side Sentry was silently absent
// from the production bundle (no browser errors, no session replay) with no
// build warning. See https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
//
// init() runs unconditionally: with an empty or undefined DSN the SDK is a
// no-op, which is what CI and local dev want.

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  integrations: [
    Sentry.replayIntegration(),
  ],
});

// Instruments App Router client-side navigations. Without this export,
// navigation spans are missing from traces.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
