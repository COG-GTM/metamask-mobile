import migrate from './011';

describe('Migration #11', () => {
  it('should add useTokenDetection to PreferencesController', () => {
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

    expect(newState.engine.backgroundState.PreferencesController.useTokenDetection).toBe(true);
    expect(newState.engine.backgroundState.PreferencesController.selectedAddress).toBe('0x1234');
  });

  it('should preserve existing state', () => {
    const oldState = {
      engine: {
        backgroundState: {
          PreferencesController: {
            identities: { '0x1': { name: 'Account 1' } },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.PreferencesController.identities).toStrictEqual({ '0x1': { name: 'Account 1' } });
    expect(newState.engine.backgroundState.PreferencesController.useTokenDetection).toBe(true);
  });
});
