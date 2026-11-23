import migrate from './014';

describe('Migration #14', () => {
  it('moves provider to providerConfig', () => {
    const oldState = {
      engine: {
        backgroundState: { NetworkController: { provider: { chainId: '1' } } },
      },
    };

    expect(migrate(oldState)).toStrictEqual({
      engine: {
        backgroundState: {
          NetworkController: { providerConfig: { chainId: '1' } },
        },
      },
    });
  });

  it('does not change state without a provider', () => {
    const oldState = {
      engine: { backgroundState: { NetworkController: {} } },
    };

    expect(migrate(oldState)).toStrictEqual(oldState);
  });
});
