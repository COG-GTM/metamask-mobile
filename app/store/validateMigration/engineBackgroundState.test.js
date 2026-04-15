import { validateEngineInitialized } from './engineBackgroundState';
import { LOG_TAG } from './validateMigration.types';

import { backgroundState } from '../../util/test/initial-root-state';

describe('validateEngineInitialized', () => {
  const createMockState = (
  hasBackgroundState) => (
  {
    engine: hasBackgroundState ? { backgroundState } : undefined
  });

  it('returns no errors when backgroundState exists', () => {
    const errors = validateEngineInitialized(
      createMockState(true)
    );
    expect(errors).toEqual([]);
  });

  it('returns error if engine state is missing', () => {
    const errors = validateEngineInitialized({});
    expect(errors).toEqual([`${LOG_TAG}: Engine backgroundState not found.`]);
  });

  it('returns error if backgroundState is missing', () => {
    const errors = validateEngineInitialized(
      createMockState(false)
    );
    expect(errors).toEqual([`${LOG_TAG}: Engine backgroundState not found.`]);
  });

  it('does not throw with malformed state', () => {
    // Test with various malformed states
    const testStates = [
    undefined,
    null,
    {},
    { engine: undefined },
    { engine: null },
    { engine: { backgroundState: undefined } },
    { engine: { backgroundState: null } }];


    testStates.forEach((state) => {
      // Verify no throw
      expect(() => {
        validateEngineInitialized(state);
      }).not.toThrow();

      // Verify returns errors array
      const errors = validateEngineInitialized(state);
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});