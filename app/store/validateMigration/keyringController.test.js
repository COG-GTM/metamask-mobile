import { validateKeyringController } from './keyringController';
import { LOG_TAG } from './validateMigration.types';




describe('validateKeyringController', () => {
  const createMockState = (
  keyringState) => (
  {
    engine: keyringState ?
    {
      backgroundState: {
        KeyringController: keyringState
      }
    } :
    undefined
  });

  const mockValidKeyringState = {
    vault: 'mock-vault',
    keyrings: [
    {
      type: 'HD Key Tree',
      accounts: ['0x123']
    }]

  };

  it('returns no errors for valid state', () => {
    const errors = validateKeyringController(
      createMockState(mockValidKeyringState)
    );
    expect(errors).toEqual([]);
  });

  it('returns error if KeyringController state is missing', () => {
    const errors = validateKeyringController(
      createMockState(undefined)
    );
    expect(errors).toEqual([
    `${LOG_TAG}: KeyringController state is missing in engine backgroundState.`]
    );
  });

  it('returns error if vault is missing', () => {
    const errors = validateKeyringController(
      createMockState({ keyrings: [] })
    );
    expect(errors).toEqual([
    `${LOG_TAG}: KeyringController No vault in KeyringControllerState.`]
    );
  });

  it('returns error if keyrings is missing or empty', () => {
    const errors = validateKeyringController(
      createMockState({ vault: 'mock-vault', keyrings: [] })
    );
    expect(errors).toEqual([
    `${LOG_TAG}: KeyringController No keyrings found.`]
    );
  });

  it('handles undefined engine state', () => {
    const errors = validateKeyringController({});
    expect(errors).toEqual([
    `${LOG_TAG}: KeyringController state is missing in engine backgroundState.`]
    );
  });

  it('handles undefined backgroundState', () => {
    const errors = validateKeyringController({ engine: {} });
    expect(errors).toEqual([
    `${LOG_TAG}: KeyringController state is missing in engine backgroundState.`]
    );
  });

  it('does not throw with malformed state', () => {
    // Test with various malformed states
    const testStates = [
    undefined,
    null,
    {},
    { engine: undefined },
    { engine: { backgroundState: undefined } },
    { engine: { backgroundState: { KeyringController: undefined } } },
    { engine: { backgroundState: { KeyringController: {} } } },
    {
      engine: {
        backgroundState: {
          KeyringController: { vault: undefined, keyrings: undefined }
        }
      }
    }];


    testStates.forEach((state) => {
      // Verify no throw
      expect(() => {
        validateKeyringController(state);
      }).not.toThrow();

      // Verify returns errors array
      const errors = validateKeyringController(state);
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});