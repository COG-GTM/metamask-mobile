import migrate from './013';

describe('Migration #13', () => {
  it('should not change state when there are no approved hosts', () => {
    const oldState = {
      privacy: {
        approvedHosts: {},
      },
      engine: {
        backgroundState: {
          PreferencesController: {},
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(oldState);
  });
});
