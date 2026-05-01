import { GET, DELETE } from './route';
import { ERRORS } from '@/lib/errors/messages';

// ─── Supabase mock infrastructure ───────────────────────────────────────────

interface ChainResult {
  count?: number | null;
  data?: unknown;
  error?: unknown;
}

function createChainMock(result: ChainResult) {
  const terminal = {
    count: result.count ?? null,
    data: result.data ?? null,
    error: result.error ?? null,
  };
  const chain: Record<string, jest.Mock> = {};
  for (const method of [
    'select',
    'eq',
    'gte',
    'order',
    'range',
    'limit',
    'single',
    'maybeSingle',
    'delete',
  ]) {
    chain[method] = jest.fn(() =>
      method === 'single' || method === 'maybeSingle' ? terminal : chain
    );
  }
  // For count queries (head: true), attach terminal values to chain
  Object.assign(chain, terminal);
  return chain;
}

let mockUser: { id: string } | null = null;
let mockCountChain: ReturnType<typeof createChainMock>;
let mockDataChain: ReturnType<typeof createChainMock>;
let mockDeleteChain: ReturnType<typeof createChainMock>;
let fromCallCount = 0;

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(async () => ({
    auth: {
      getUser: jest.fn(async () => ({
        data: { user: mockUser },
      })),
    },
    from: jest.fn((table: string) => {
      if (table === 'submissions') {
        fromCallCount++;
        // DELETE handler only calls from('submissions') once with .delete()
        // GET handler calls from('submissions') twice: count query then data query
        if (mockDeleteChain && fromCallCount === 1) {
          return mockDeleteChain;
        }
        if (fromCallCount === 1) return mockCountChain;
        return mockDataChain;
      }
      return createChainMock({ data: null, error: null });
    }),
  })),
}));

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/submissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fromCallCount = 0;
    mockUser = null;
    mockDeleteChain = undefined as unknown as ReturnType<typeof createChainMock>;
  });

  it('returns 401 when no session', async () => {
    mockUser = null;
    const req = new Request('http://localhost/api/submissions');
    const res = await GET(req);
    expect(res.status).toBe(ERRORS.AUTH_REQUIRED.status);
    const body = await res.json();
    expect(body.error_code).toBe('AUTH_REQUIRED');
  });

  it('returns paginated submissions for authenticated user', async () => {
    mockUser = { id: 'user-123' };
    mockCountChain = createChainMock({ count: 1, error: null });
    mockDataChain = createChainMock({
      data: [
        {
          id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          version_number: 1,
          conceptual_score: 85,
          outcomes_score: 70,
          monitoring_score: 90,
          final_score: 82,
          assessment_confidence_label: 'High',
          model_type: 'other',
          is_synthetic: false,
          created_at: '2026-01-01T00:00:00.000Z',
          models: { model_name: 'Test Model' },
        },
      ],
      error: null,
    });

    const req = new Request('http://localhost/api/submissions?page=1&limit=10');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].model_name).toBe('Test Model');
    expect(body.data[0].status).toBe('Compliant');
    expect(body.page).toBe(1);
    expect(body.limit).toBe(10);
    expect(body.total).toBe(1);
    expect(body.totalPages).toBe(1);
  });

  it('returns 400 for invalid page/limit params', async () => {
    mockUser = { id: 'user-123' };
    const req = new Request('http://localhost/api/submissions?page=-1&limit=0');
    const res = await GET(req);
    expect(res.status).toBe(ERRORS.VALIDATION_ERROR.status);
    const body = await res.json();
    expect(body.error_code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/submissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fromCallCount = 0;
    mockUser = null;
    mockDeleteChain = undefined as unknown as ReturnType<typeof createChainMock>;
  });

  it('returns 401 when no session', async () => {
    mockUser = null;
    const req = new Request('http://localhost/api/submissions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(ERRORS.AUTH_REQUIRED.status);
    const body = await res.json();
    expect(body.error_code).toBe('AUTH_REQUIRED');
  });

  it('rejects when confirm is missing', async () => {
    mockUser = { id: 'user-123' };
    const req = new Request('http://localhost/api/submissions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(ERRORS.VALIDATION_ERROR.status);
    const body = await res.json();
    expect(body.error_code).toBe('VALIDATION_ERROR');
  });

  it('rejects when confirm is false', async () => {
    mockUser = { id: 'user-123' };
    const req = new Request('http://localhost/api/submissions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: false }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(ERRORS.VALIDATION_ERROR.status);
    const body = await res.json();
    expect(body.error_code).toBe('VALIDATION_ERROR');
  });

  it('returns 204 when confirm is true', async () => {
    mockUser = { id: 'user-123' };
    const deleteChain = createChainMock({ data: null, error: null });
    deleteChain['delete'] = jest.fn(() => deleteChain);
    mockDeleteChain = deleteChain;

    const req = new Request('http://localhost/api/submissions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(204);
  });
});
