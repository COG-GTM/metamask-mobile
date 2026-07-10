import migrate from './010';

describe('Migration #10', () => {
  it('should disable collectible detection and OpenSea preferences', () => {
    const oldState = {
      engine: {
        backgroundState: {
          PreferencesController: { existing: true },
        },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.PreferencesController,
    ).toStrictEqual({
      existing: true,
      useCollectibleDetection: false,
      openSeaEnabled: false,
    });
  });
});
