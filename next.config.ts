import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

// 'unsafe-inline' required: Next.js App Router injects inline scripts
// for hydration/routing; nonce-based CSP not yet production-ready.
// 'unsafe-eval' required in dev only: React uses eval() for debugging callstacks.
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDev ? ["'unsafe-eval'"] : []),
  "https://vercel.live",
  "https://va.vercel-scripts.com",
].join(" ");

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth", "@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/report": ["./public/fonts/pdf/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://va.vercel-scripts.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
