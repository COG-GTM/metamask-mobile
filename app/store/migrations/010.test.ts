import migrate from './010';

describe('Migration #10', () => {
  it('should disable collectible detection and OpenSea preferences', () => {
    const oldState = {
      engine: {
        backgroundState: {
          PreferencesController: {},
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      engine: {
        backgroundState: {
          PreferencesController: {
            useCollectibleDetection: false,
            openSeaEnabled: false,
          },
        },
      },
    });
  });
});
