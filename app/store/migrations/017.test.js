import migrate from './017';

describe('Migration #17', () => {
  it('should clear networkOnboardedState', () => {
    const oldState = {
      networkOnboarded: {
        networkOnboardedState: {
          '0x1': true,
          '0x89': true,
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.networkOnboarded.networkOnboardedState).toStrictEqual({});
  });

  it('should not change state if networkOnboarded is missing', () => {
    const oldState = {
      foo: 'bar',
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(oldState);
  });

  it('should not change state if networkOnboardedState is missing', () => {
    const oldState = {
      networkOnboarded: {},
    };

    const newState = migrate(oldState);

    expect(newState.networkOnboarded).toStrictEqual({});
  });

  it('should handle already empty networkOnboardedState', () => {
    const oldState = {
      networkOnboarded: {
        networkOnboardedState: {},
      },
    };

    const newState = migrate(oldState);

    expect(newState.networkOnboarded.networkOnboardedState).toStrictEqual({});
  });
});
