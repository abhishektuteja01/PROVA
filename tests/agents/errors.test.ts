/**
 * TDD REFACTOR PHASE — AgentParseError & AgentSchemaError
 *
 * Extracted a shared `makeError` helper for each class and added
 * an additional cross-class instanceof check to confirm the two
 * error types are distinct.
 * No behaviour changes — same assertions, less duplication.
 */
import { AgentParseError, AgentSchemaError } from '@/lib/agents/errors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeParseError(pillar = 'conceptual_soundness'): AgentParseError {
  return new AgentParseError('bad JSON', pillar);
}

function makeSchemaError(pillar = 'ongoing_monitoring'): AgentSchemaError {
  return new AgentSchemaError('schema mismatch', pillar);
}

// ─── AgentParseError ──────────────────────────────────────────────────────────

describe('AgentParseError', () => {
  it('is an instance of Error', () => {
    expect(makeParseError() instanceof Error).toBe(true);
  });

  it('is an instance of AgentParseError', () => {
    expect(makeParseError() instanceof AgentParseError).toBe(true);
  });

  it('has name "AgentParseError"', () => {
    expect(makeParseError().name).toBe('AgentParseError');
  });

  it('stores the message passed to the constructor', () => {
    expect(makeParseError().message).toBe('bad JSON');
  });

  it('stores the pillar passed to the constructor', () => {
    expect(makeParseError('outcomes_analysis').pillar).toBe('outcomes_analysis');
  });
});

// ─── AgentSchemaError ─────────────────────────────────────────────────────────

describe('AgentSchemaError', () => {
  it('is an instance of Error', () => {
    expect(makeSchemaError() instanceof Error).toBe(true);
  });

  it('is an instance of AgentSchemaError', () => {
    expect(makeSchemaError() instanceof AgentSchemaError).toBe(true);
  });

  it('has name "AgentSchemaError" (distinct from AgentParseError)', () => {
    expect(makeSchemaError().name).toBe('AgentSchemaError');
  });

  it('stores the message passed to the constructor', () => {
    expect(makeSchemaError().message).toBe('schema mismatch');
  });

  it('stores the pillar passed to the constructor', () => {
    expect(makeSchemaError('ongoing_monitoring').pillar).toBe('ongoing_monitoring');
  });
});

// ─── Cross-class check ────────────────────────────────────────────────────────

describe('AgentParseError vs AgentSchemaError', () => {
  it('AgentParseError is NOT an instance of AgentSchemaError', () => {
    expect(makeParseError() instanceof AgentSchemaError).toBe(false);
  });

  it('AgentSchemaError is NOT an instance of AgentParseError', () => {
    expect(makeSchemaError() instanceof AgentParseError).toBe(false);
  });
});
