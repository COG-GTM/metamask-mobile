import migrate from './017';

describe('Migration #17', () => {
  it('should reset network onboarded state', () => {
    const oldState = {
      networkOnboarded: {
        networkOnboardedState: { '1': true },
      },
    };

    const newState = migrate(oldState);

    expect(newState.networkOnboarded?.networkOnboardedState).toStrictEqual({});
  });

  it('should return state unaltered if there is no network onboarded state', () => {
    const oldState = { otherProperty: 'value' };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(oldState);
  });
});
