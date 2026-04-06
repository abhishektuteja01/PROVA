import { GET } from './route';

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        limit: () => Promise.resolve({ error: null }),
      }),
    }),
  }),
}));

describe('GET /api/health', () => {
  it('returns 200 with status ok when database is reachable', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(body.checks.database).toBe(true);
    expect(() => new Date(body.timestamp as string)).not.toThrow();
  });
});
