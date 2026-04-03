import { checkRateLimit } from "./rateLimit";

// Build a chainable mock that mimics the Supabase query builder
function createChainMock(result: { count?: number | null; data?: unknown; error?: unknown }) {
  const terminal = {
    count: result.count ?? null,
    data: result.data ?? null,
    error: result.error ?? null,
  };
  const chain: Record<string, jest.Mock> = {};
  // Each method returns the chain itself, except terminal calls return the result
  for (const method of ["select", "eq", "gte", "order", "limit", "single", "maybeSingle"]) {
    chain[method] = jest.fn(() =>
      method === "single" || method === "maybeSingle" ? terminal : chain
    );
  }
  // For count queries (head: true), the chain itself IS the result
  Object.assign(chain, terminal);
  return chain;
}

let mockChain: ReturnType<typeof createChainMock>;

jest.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: () => mockChain,
  }),
}));

const ORIGINAL_LIMIT = process.env.RATE_LIMIT_REQUESTS_PER_HOUR;

describe("checkRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: under limit
    mockChain = createChainMock({ count: 0, error: null });
  });

  afterAll(() => {
    if (ORIGINAL_LIMIT === undefined) {
      delete process.env.RATE_LIMIT_REQUESTS_PER_HOUR;
    } else {
      process.env.RATE_LIMIT_REQUESTS_PER_HOUR = ORIGINAL_LIMIT;
    }
  });

  it("allows first request for a new user", async () => {
    mockChain = createChainMock({ count: 0, error: null });
    const result = await checkRateLimit("user-1");
    expect(result.allowed).toBe(true);
  });

  it("allows requests under the limit", async () => {
    mockChain = createChainMock({ count: 5, error: null });
    const result = await checkRateLimit("user-under");
    expect(result.allowed).toBe(true);
  });

  it("blocks when count equals the limit", async () => {
    // The count query and the oldest-row query both go through the same mock chain
    // When count >= limit, the code does a second query for the oldest row
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    mockChain = createChainMock({
      count: 10,
      data: { created_at: thirtyMinAgo },
      error: null,
    });
    const result = await checkRateLimit("user-at-limit");
    expect(result.allowed).toBe(false);
    expect(result.resetAt).toBeInstanceOf(Date);
  });

  it("blocks when count exceeds the limit", async () => {
    const fortyFiveMinAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    mockChain = createChainMock({
      count: 15,
      data: { created_at: fortyFiveMinAgo },
      error: null,
    });
    const result = await checkRateLimit("user-over");
    expect(result.allowed).toBe(false);
  });

  it("blocks request when Supabase count query fails (fail-closed)", async () => {
    mockChain = createChainMock({ count: null, error: { message: "DB error" } });
    const result = await checkRateLimit("user-error");
    expect(result.allowed).toBe(false);
    expect(result.resetAt).toBeDefined();
  });

  it("uses custom limit from env var", async () => {
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = "3";
    mockChain = createChainMock({
      count: 3,
      data: { created_at: new Date().toISOString() },
      error: null,
    });

    const result = await checkRateLimit("user-custom");
    expect(result.allowed).toBe(false);

    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = ORIGINAL_LIMIT;
  });

  it("falls back to limit 10 when env var is not a valid number", async () => {
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = "notanumber";
    mockChain = createChainMock({ count: 9, error: null });

    const result = await checkRateLimit("user-nan");
    expect(result.allowed).toBe(true);

    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = ORIGINAL_LIMIT;
  });

  it("falls back to limit 10 when env var is zero", async () => {
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = "0";
    mockChain = createChainMock({ count: 5, error: null });

    const result = await checkRateLimit("user-zero");
    expect(result.allowed).toBe(true);

    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = ORIGINAL_LIMIT;
  });

  it("falls back to limit 10 when env var is negative", async () => {
    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = "-5";
    mockChain = createChainMock({ count: 5, error: null });

    const result = await checkRateLimit("user-neg");
    expect(result.allowed).toBe(true);

    process.env.RATE_LIMIT_REQUESTS_PER_HOUR = ORIGINAL_LIMIT;
  });
});
