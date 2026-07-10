import migrate from './014';

describe('Migration #14', () => {
  it('should rename provider to providerConfig', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: { type: 'mainnet', chainId: '1' },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController).toStrictEqual({
      providerConfig: { type: 'mainnet', chainId: '1' },
    });
  });

  it('should return state unaltered if there is no provider', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: { type: 'mainnet' },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState).toStrictEqual(oldState);
  });
});
