import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "npm run build && npx next start",
    port: 3000,
    reuseExistingServer: true,
    env: {
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
        "placeholder",
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
    },
  },
});
