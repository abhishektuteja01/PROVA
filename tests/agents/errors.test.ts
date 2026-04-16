/**
 * TDD RED PHASE — AgentParseError & AgentSchemaError
 *
 * These classes are defined in src/lib/agents/errors.ts but have no tests.
 * All assertions below are deliberately wrong to record the red phase.
 */
import { AgentParseError, AgentSchemaError } from '@/lib/agents/errors';

describe('AgentParseError — RED phase (wrong assertions)', () => {
  it('should NOT be an instance of Error (WRONG: it extends Error)', () => {
    const err = new AgentParseError('bad JSON', 'conceptual_soundness');
    expect(err instanceof Error).toBe(false);
  });

  it('should have name "Error" instead of "AgentParseError" (WRONG: name is set explicitly)', () => {
    const err = new AgentParseError('bad JSON', 'conceptual_soundness');
    expect(err.name).toBe('Error');
  });

  it('should have pillar set to "unknown" (WRONG: pillar is passed in constructor)', () => {
    const err = new AgentParseError('bad JSON', 'outcomes_analysis');
    expect(err.pillar).toBe('unknown');
  });

  it('should have message "wrong message" (WRONG: message comes from constructor)', () => {
    const err = new AgentParseError('bad JSON', 'conceptual_soundness');
    expect(err.message).toBe('wrong message');
  });
});

describe('AgentSchemaError — RED phase (wrong assertions)', () => {
  it('should NOT be an instance of Error (WRONG: it extends Error)', () => {
    const err = new AgentSchemaError('schema mismatch', 'ongoing_monitoring');
    expect(err instanceof Error).toBe(false);
  });

  it('should have name "AgentParseError" (WRONG: name should be "AgentSchemaError")', () => {
    const err = new AgentSchemaError('schema mismatch', 'ongoing_monitoring');
    expect(err.name).toBe('AgentParseError');
  });

  it('should have pillar "conceptual_soundness" (WRONG: pillar is set to what is passed in)', () => {
    const err = new AgentSchemaError('schema mismatch', 'ongoing_monitoring');
    expect(err.pillar).toBe('conceptual_soundness');
  });
});
