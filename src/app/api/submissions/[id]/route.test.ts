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
  Object.assign(chain, terminal);
  return chain;
}

let mockUser: { id: string } | null = null;
let mockSubmissionChain: ReturnType<typeof createChainMock>;
let mockGapsChain: ReturnType<typeof createChainMock>;
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
        // For DELETE: first call is select (ownership check), second is delete
        if (fromCallCount === 2 && mockDeleteChain) {
          return mockDeleteChain;
        }
        return mockSubmissionChain;
      }
      if (table === 'gaps') {
        return mockGapsChain;
      }
      return createChainMock({ data: null, error: null });
    }),
  })),
}));

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

// ─── Test constants ─────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const OTHER_USER_ID = 'f1e2d3c4-b5a6-4978-8a6b-5c4d3e2f1a0b';

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

const MOCK_SUBMISSION_ROW = {
  id: VALID_UUID,
  user_id: 'user-123',
  version_number: 1,
  document_text: 'Test document text for compliance analysis.',
  conceptual_score: 85,
  outcomes_score: 70,
  monitoring_score: 90,
  final_score: 82,
  judge_confidence: 0.9,
  assessment_confidence_label: 'High',
  created_at: '2026-01-01T00:00:00.000Z',
  models: { model_name: 'Test Model' },
};

const MOCK_GAPS = [
  {
    element_code: 'CS-01',
    element_name: 'Model Purpose',
    severity: 'Minor',
    description: 'Missing detail on intended use.',
    recommendation: 'Add a section on intended use cases.',
  },
];

// ─── Tests: GET /api/submissions/[id] ───────────────────────────────────────

describe('GET /api/submissions/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fromCallCount = 0;
    mockUser = null;
    mockDeleteChain = undefined as unknown as ReturnType<typeof createChainMock>;
  });

  it('returns 401 when no session', async () => {
    mockUser = null;
    const req = new Request(`http://localhost/api/submissions/${VALID_UUID}`);
    const res = await GET(req, makeParams(VALID_UUID));
    expect(res.status).toBe(ERRORS.AUTH_REQUIRED.status);
    const body = await res.json();
    expect(body.error_code).toBe('AUTH_REQUIRED');
  });

  it('returns submission with gaps for valid id', async () => {
    mockUser = { id: 'user-123' };
    mockSubmissionChain = createChainMock({
      data: MOCK_SUBMISSION_ROW,
      error: null,
    });
    mockGapsChain = createChainMock({
      data: MOCK_GAPS,
      error: null,
    });
    // Gaps chain: select(...).eq(...) should return terminal with data
    mockGapsChain['eq'] = jest.fn(() => ({
      data: MOCK_GAPS,
      error: null,
    }));

    const req = new Request(`http://localhost/api/submissions/${VALID_UUID}`);
    const res = await GET(req, makeParams(VALID_UUID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(VALID_UUID);
    expect(body.model_name).toBe('Test Model');
    expect(body.status).toBe('Compliant');
    expect(body.gap_analysis).toHaveLength(1);
    expect(body.gap_analysis[0].element_code).toBe('CS-01');
    expect(body.judge_confidence).toBe(0.9);
  });

  it('returns 404 for wrong user submission', async () => {
    mockUser = { id: OTHER_USER_ID };
    mockSubmissionChain = createChainMock({
      data: MOCK_SUBMISSION_ROW, // user_id is 'user-123', not OTHER_USER_ID
      error: null,
    });

    const req = new Request(`http://localhost/api/submissions/${VALID_UUID}`);
    const res = await GET(req, makeParams(VALID_UUID));
    expect(res.status).toBe(ERRORS.SUBMISSION_NOT_FOUND.status);
    const body = await res.json();
    expect(body.error_code).toBe('SUBMISSION_NOT_FOUND');
  });

  it('returns 404 for non-existent id', async () => {
    mockUser = { id: 'user-123' };
    mockSubmissionChain = createChainMock({
      data: null,
      error: null,
    });

    const req = new Request(`http://localhost/api/submissions/${VALID_UUID}`);
    const res = await GET(req, makeParams(VALID_UUID));
    expect(res.status).toBe(ERRORS.SUBMISSION_NOT_FOUND.status);
    const body = await res.json();
    expect(body.error_code).toBe('SUBMISSION_NOT_FOUND');
  });
});

// ─── Tests: DELETE /api/submissions/[id] ────────────────────────────────────

describe('DELETE /api/submissions/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fromCallCount = 0;
    mockUser = null;
    mockDeleteChain = undefined as unknown as ReturnType<typeof createChainMock>;
  });

  it('returns 401 when no session', async () => {
    mockUser = null;
    const req = new Request(`http://localhost/api/submissions/${VALID_UUID}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req, makeParams(VALID_UUID));
    expect(res.status).toBe(ERRORS.AUTH_REQUIRED.status);
    const body = await res.json();
    expect(body.error_code).toBe('AUTH_REQUIRED');
  });

  it('returns 204 for valid delete', async () => {
    mockUser = { id: 'user-123' };
    // First from('submissions') call: ownership check
    mockSubmissionChain = createChainMock({
      data: { id: VALID_UUID, user_id: 'user-123' },
      error: null,
    });
    // Second from('submissions') call: actual delete
    const deleteChain = createChainMock({ data: null, error: null });
    deleteChain['delete'] = jest.fn(() => deleteChain);
    mockDeleteChain = deleteChain;

    const req = new Request(`http://localhost/api/submissions/${VALID_UUID}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req, makeParams(VALID_UUID));
    expect(res.status).toBe(204);
  });

  it('returns 404 when deleting another user submission', async () => {
    mockUser = { id: OTHER_USER_ID };
    mockSubmissionChain = createChainMock({
      data: { id: VALID_UUID, user_id: 'user-123' },
      error: null,
    });

    const req = new Request(`http://localhost/api/submissions/${VALID_UUID}`, {
      method: 'DELETE',
    });
    const res = await DELETE(req, makeParams(VALID_UUID));
    expect(res.status).toBe(ERRORS.SUBMISSION_NOT_FOUND.status);
    const body = await res.json();
    expect(body.error_code).toBe('SUBMISSION_NOT_FOUND');
  });
});
