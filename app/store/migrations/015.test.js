import migrate from './015';

jest.mock('@metamask/controller-utils', () => ({
  NetworksChainId: {
    goerli: '5',
  },
}));

jest.mock('../../../app/constants/network', () => ({
  GOERLI: 'goerli',
}));

describe('Migration #15', () => {
  it('should migrate rinkeby (chainId 4) to goerli', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: {
              chainId: '4',
              type: 'rinkeby',
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.providerConfig.chainId).toBe('5');
    expect(newState.engine.backgroundState.NetworkController.providerConfig.type).toBe('goerli');
  });

  it('should migrate ropsten (chainId 3) to goerli', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: {
              chainId: '3',
              type: 'ropsten',
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.providerConfig.type).toBe('goerli');
  });

  it('should migrate kovan (chainId 42) to goerli', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: {
              chainId: '42',
              type: 'kovan',
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.providerConfig.type).toBe('goerli');
  });

  it('should not change mainnet', () => {
    const oldState = {
      engine: {
        backgroundState: {
          NetworkController: {
            providerConfig: {
              chainId: '1',
              type: 'mainnet',
            },
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.NetworkController.providerConfig.chainId).toBe('1');
    expect(newState.engine.backgroundState.NetworkController.providerConfig.type).toBe('mainnet');
  });
});
