/**
 * TDD GREEN PHASE — AgentParseError & AgentSchemaError
 *
 * Assertions corrected to match the real behaviour of both error classes.
 * All tests now pass without any changes to the source implementation.
 */
import { AgentParseError, AgentSchemaError } from '@/lib/agents/errors';

describe('AgentParseError', () => {
  it('is an instance of Error', () => {
    const err = new AgentParseError('bad JSON', 'conceptual_soundness');
    expect(err instanceof Error).toBe(true);
  });

  it('has name "AgentParseError"', () => {
    const err = new AgentParseError('bad JSON', 'conceptual_soundness');
    expect(err.name).toBe('AgentParseError');
  });

  it('stores the pillar passed to the constructor', () => {
    const err = new AgentParseError('bad JSON', 'outcomes_analysis');
    expect(err.pillar).toBe('outcomes_analysis');
  });

  it('stores the message passed to the constructor', () => {
    const err = new AgentParseError('bad JSON', 'conceptual_soundness');
    expect(err.message).toBe('bad JSON');
  });
});

describe('AgentSchemaError', () => {
  it('is an instance of Error', () => {
    const err = new AgentSchemaError('schema mismatch', 'ongoing_monitoring');
    expect(err instanceof Error).toBe(true);
  });

  it('has name "AgentSchemaError" (distinct from AgentParseError)', () => {
    const err = new AgentSchemaError('schema mismatch', 'ongoing_monitoring');
    expect(err.name).toBe('AgentSchemaError');
  });

  it('stores the pillar passed to the constructor', () => {
    const err = new AgentSchemaError('schema mismatch', 'ongoing_monitoring');
    expect(err.pillar).toBe('ongoing_monitoring');
  });
});
