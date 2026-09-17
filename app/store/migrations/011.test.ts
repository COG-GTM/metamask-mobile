import migrate from './011';

describe('Migration #11', () => {
  it('should enable token detection preference', () => {
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
    ).toStrictEqual({ existing: true, useTokenDetection: true });
  });
});
