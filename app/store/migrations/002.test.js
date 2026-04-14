import migrate from './002';

jest.mock('../../util/networks', () => ({
  getAllNetworks: () => ['mainnet', 'goerli', 'sepolia'],
  isSafeChainId: (chainId) => Number.isSafeInteger(chainId) && chainId > 0 && chainId <= 4503599627370476,
}));

jest.mock('../../../app/constants/network', () => ({
  GOERLI: 'goerli',
}));

describe('Migration #02', () => {
  it('should not change state for initial networks', () => {
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

    expect(newState.engine.backgroundState.NetworkController.provider.type).toBe('mainnet');
  });

  it('should switch to goerli if custom RPC has invalid chainId', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: {
              type: 'rpc',
              chainId: 'invalid',
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.provider.type).toBe('goerli');
    expect(newState.engine.backgroundState.NetworkController.provider.ticker).toBe('ETH');
  });

  it('should not change state for custom RPC with valid chainId', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: {
              type: 'rpc',
              chainId: '137',
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.provider.type).toBe('rpc');
  });
});
