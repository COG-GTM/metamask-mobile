import migrate from './010';

describe('Migration #10', () => {
  it('should add useCollectibleDetection and openSeaEnabled to PreferencesController', () => {
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

    expect(newState.engine.backgroundState.PreferencesController.useCollectibleDetection).toBe(false);
    expect(newState.engine.backgroundState.PreferencesController.openSeaEnabled).toBe(false);
    expect(newState.engine.backgroundState.PreferencesController.selectedAddress).toBe('0x1234');
  });

  it('should preserve existing PreferencesController state', () => {
    const oldState = {
      engine: {
        backgroundState: {
          PreferencesController: {},
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.PreferencesController.useCollectibleDetection).toBe(false);
    expect(newState.engine.backgroundState.PreferencesController.openSeaEnabled).toBe(false);
  });
});
