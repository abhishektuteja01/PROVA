import { POST } from './route';
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

// Mock the renderReport helper — avoids loading @react-pdf/renderer in tests
jest.mock('@/components/report/renderReport', () => ({
  renderReport: jest.fn(async () => Buffer.from('mock-pdf-content')),
}));

// ─── Test constants ─────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const OTHER_USER_ID = 'f1e2d3c4-b5a6-4978-8a6b-5c4d3e2f1a0b';

const MOCK_SUBMISSION_ROW = {
  id: VALID_UUID,
  user_id: 'user-123',
  version_number: 1,
  conceptual_score: 85,
  outcomes_score: 70,
  monitoring_score: 90,
  final_score: 82,
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

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/report', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fromCallCount = 0;
    mockUser = null;
  });

  it('returns 401 when no session', async () => {
    mockUser = null;
    const req = new Request('http://localhost/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: VALID_UUID }),
    });
    const res = await POST(req);
    expect(res.status).toBe(ERRORS.AUTH_REQUIRED.status);
    const body = await res.json();
    expect(body.error_code).toBe('AUTH_REQUIRED');
  });

  it('returns 400 when submission_id is missing', async () => {
    mockUser = { id: 'user-123' };
    const req = new Request('http://localhost/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(ERRORS.VALIDATION_ERROR.status);
    const body = await res.json();
    expect(body.error_code).toBe('VALIDATION_ERROR');
  });

  it('returns PDF for valid request', async () => {
    mockUser = { id: 'user-123' };
    mockSubmissionChain = createChainMock({
      data: MOCK_SUBMISSION_ROW,
      error: null,
    });
    mockGapsChain = createChainMock({
      data: MOCK_GAPS,
      error: null,
    });
    mockGapsChain['eq'] = jest.fn(() => ({
      data: MOCK_GAPS,
      error: null,
    }));

    const req = new Request('http://localhost/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: VALID_UUID }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('prova-report-');
    expect(res.headers.get('Content-Disposition')).toContain('.pdf');
  });

  it('returns 404 for wrong user submission', async () => {
    mockUser = { id: OTHER_USER_ID };
    mockSubmissionChain = createChainMock({
      data: MOCK_SUBMISSION_ROW, // user_id is 'user-123'
      error: null,
    });

    const req = new Request('http://localhost/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: VALID_UUID }),
    });
    const res = await POST(req);
    expect(res.status).toBe(ERRORS.SUBMISSION_NOT_FOUND.status);
    const body = await res.json();
    expect(body.error_code).toBe('SUBMISSION_NOT_FOUND');
  });
});
