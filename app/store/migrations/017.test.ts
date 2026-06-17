import migrate from './017';

describe('Migration #17', () => {
  it('should reset the network onboarded state', () => {
    const oldState = {
      networkOnboarded: {
        networkOnboardedState: { '0x1': true },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({
      networkOnboarded: {
        networkOnboardedState: {},
      },
    });
  });
});
