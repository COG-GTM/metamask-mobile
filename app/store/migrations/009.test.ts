import migrate from './009';

describe('Migration #9', () => {
  it('should enable useStaticTokenList preference', () => {
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
    ).toStrictEqual({ existing: true, useStaticTokenList: true });
  });
});
