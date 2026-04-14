import migrate from './003';

jest.mock('@metamask/controller-utils', () => ({
  NetworksChainId: {
    mainnet: '1',
    goerli: '5',
    sepolia: '11155111',
  },
}));

jest.mock('../../util/networks', () => ({
  isSafeChainId: (chainId) => Number.isSafeInteger(chainId) && chainId > 0 && chainId <= 4503599627370476,
}));

jest.mock('../../../app/constants/network', () => ({
  GOERLI: 'goerli',
}));

jest.mock('../../../app/util/regex', () => ({
  regex: {
    decimalStringMigrations: /^\d+$/u,
  },
}));

describe('Migration #03', () => {
  it('should add chainId to known network type', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: {
              type: 'mainnet',
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.provider.chainId).toBe('1');
  });

  it('should switch to goerli for rpc with invalid chainId', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            provider: {
              type: 'rpc',
              chainId: 'not-a-number',
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.provider.type).toBe('goerli');
    expect(newState.engine.backgroundState.NetworkController.provider.chainId).toBe('5');
  });

  it('should keep valid rpc chainId', () => {
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

    expect(newState.engine.backgroundState.NetworkController.provider.chainId).toBe('137');
  });
});
