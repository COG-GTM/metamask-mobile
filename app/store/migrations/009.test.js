import migrate from './009';

describe('Migration #09', () => {
  it('should add useStaticTokenList to PreferencesController', () => {
    const oldState = {
      engine: {
        backgroundState: {
          PreferencesController: {
            selectedAddress: '0x1234',
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.PreferencesController.useStaticTokenList).toBe(true);
    expect(newState.engine.backgroundState.PreferencesController.selectedAddress).toBe('0x1234');
  });

  it('should preserve existing PreferencesController state', () => {
    const oldState = {
      engine: {
        backgroundState: {
          PreferencesController: {
            identities: {},
            selectedAddress: '0xABC',
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.PreferencesController.identities).toStrictEqual({});
    expect(newState.engine.backgroundState.PreferencesController.useStaticTokenList).toBe(true);
  });
});
