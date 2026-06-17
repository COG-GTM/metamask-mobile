import migrate from './011';

describe('Migration #11', () => {
  it('should enable token detection preference', () => {
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
            useTokenDetection: true,
          },
        },
      },
    });
  });
});
