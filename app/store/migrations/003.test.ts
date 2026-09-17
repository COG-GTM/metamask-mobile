import migrate from './003';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  NetworksChainId: { mainnet: '1', goerli: '5', rpc: '' },
}));

jest.mock('../../util/networks', () => ({
  isSafeChainId: jest.fn((chainId: number) => !Number.isNaN(chainId)),
}));

describe('Migration #3', () => {
  it('should set the chain ID for a known network type', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: { type: 'mainnet' },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.NetworkController.provider,
    ).toStrictEqual({ type: 'mainnet', chainId: '1' });
  });

  it('should keep a custom RPC network with a valid decimal chain ID', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: { type: 'rpc', chainId: '100' },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.NetworkController.provider,
    ).toStrictEqual({ type: 'rpc', chainId: '100' });
  });

  it('should fall back to goerli for a custom RPC network with an invalid chain ID', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: { type: 'rpc', chainId: 'not-a-number' },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.NetworkController.provider,
    ).toStrictEqual({ ticker: 'ETH', type: 'goerli', chainId: '5' });
  });
});
