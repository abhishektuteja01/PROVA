export async function register() {
  // Polyfill DOM globals that pdfjs-dist expects but don't exist in
  // Vercel's serverless Node.js runtime. We do this here in instrumentation
  // to guarantee they are polyfilled universally before any routes evaluate.
  if (typeof globalThis.DOMMatrix === "undefined") {
    (globalThis as Record<string, unknown>).DOMMatrix = class DOMMatrix {};
  }
  if (typeof globalThis.Path2D === "undefined") {
    (globalThis as Record<string, unknown>).Path2D = class Path2D {};
  }
  if (typeof globalThis.ImageData === "undefined") {
    (globalThis as Record<string, unknown>).ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(width: number, height: number) {
        this.data = new Uint8ClampedArray(width * height * 4);
        this.width = width;
        this.height = height;
      }
    };
  }


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
