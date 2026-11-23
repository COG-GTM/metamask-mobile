import migrate from './017';

describe('Migration #17', () => {
  it('resets networkOnboardedState', () => {
    const oldState = {
      networkOnboarded: { networkOnboardedState: { 1: true } },
    };

    expect(migrate(oldState)).toStrictEqual({
      networkOnboarded: { networkOnboardedState: {} },
    });
  });

  it('does not change state without networkOnboarded', () => {
    const oldState = { foo: 'bar' };

    expect(migrate(oldState)).toStrictEqual(oldState);
  });
});
