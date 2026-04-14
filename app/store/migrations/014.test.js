import migrate from './014';

describe('Migration #14', () => {
  it('should rename provider to providerConfig', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: {
              type: 'mainnet',
              chainId: '1',
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.providerConfig).toStrictEqual({
      type: 'mainnet',
      chainId: '1',
    });
    expect(newState.engine.backgroundState.NetworkController.provider).toBeUndefined();
  });

  it('should not change state if provider does not exist', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: {
              type: 'mainnet',
              chainId: '1',
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.providerConfig).toStrictEqual({
      type: 'mainnet',
      chainId: '1',
    });
  });
});
