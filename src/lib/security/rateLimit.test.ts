import { checkRateLimit } from "./rateLimit";

const ORIGINAL_LIMIT = process.env.RATE_LIMIT_REQUESTS_PER_HOUR;

describe("checkRateLimit", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    // Restore env var to avoid polluting other test suites
    if (ORIGINAL_LIMIT === undefined) {
      delete process.env.RATE_LIMIT_REQUESTS_PER_HOUR;
    } else {
      process.env.RATE_LIMIT_REQUESTS_PER_HOUR = ORIGINAL_LIMIT;
    }
  });

  it("allows first request for a new user", async () => {
    const result = await checkRateLimit("user-1");
    expect(result.allowed).toBe(true);
  });

  it("allows requests up to the limit", async () => {
    const limit = 3;
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = String(limit);
    const { checkRateLimit: check } = await import("./rateLimit");

    for (let i = 0; i < limit; i++) {
      const result = await check("user-limit");
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", async () => {
    const limit = 2;
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = String(limit);
    const { checkRateLimit: check } = await import("./rateLimit");

    await check("user-block");
    await check("user-block");
    const result = await check("user-block");

    expect(result.allowed).toBe(false);
    expect(result.resetAt).toBeInstanceOf(Date);
  });

  it("uses separate counters per userId", async () => {
    const { checkRateLimit: check } = await import("./rateLimit");

    const r1 = await check("user-a");
    const r2 = await check("user-b");

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  it("allows requests again after the hour window expires", async () => {
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = "1";
    const { checkRateLimit: check } = await import("./rateLimit");

    await check("user-expire");
    const blocked = await check("user-expire");
    expect(blocked.allowed).toBe(false);

    jest.advanceTimersByTime(60 * 60 * 1000 + 1);

    const allowed = await check("user-expire");
    expect(allowed.allowed).toBe(true);
  });

  it("falls back to limit 10 when env var is not a valid number", async () => {
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = "notanumber";
    const { checkRateLimit: check } = await import("./rateLimit");

    // Should still enforce the default limit of 10 — not bypass rate limiting
    for (let i = 0; i < 10; i++) {
      const r = await check("user-nan");
      expect(r.allowed).toBe(true);
    }
    const blocked = await check("user-nan");
    expect(blocked.allowed).toBe(false);
  });

  it("falls back to limit 10 when env var is zero", async () => {
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = "0";
    const { checkRateLimit: check } = await import("./rateLimit");

    // A zero limit must not block every request immediately
    const first = await check("user-zero");
    expect(first.allowed).toBe(true);
  });

  it("falls back to limit 10 when env var is negative", async () => {
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = "-5";
    const { checkRateLimit: check } = await import("./rateLimit");

    const first = await check("user-neg");
    expect(first.allowed).toBe(true);
  });
});
