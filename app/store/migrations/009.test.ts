import migrate from './009';

describe('Migration #9', () => {
  it('should enable the static token list preference', () => {
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
            useStaticTokenList: true,
          },
        },
      },
    });
  });
});
