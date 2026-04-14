import migrate from './004';

jest.mock('@metamask/controller-utils', () => ({
  NetworksChainId: {
    mainnet: '1',
    goerli: '5',
  },
}));

describe('Migration #04', () => {
  it('should re-key tokens, collectibles, and contracts by chainId', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {
              '0xAddress1': {
                mainnet: [{ symbol: 'DAI' }],
              },
            },
          },
          CollectiblesController: {
            allCollectibles: {
              '0xAddress1': {
                mainnet: [{ tokenId: '1' }],
              },
            },
            allCollectibleContracts: {
              '0xAddress1': {
                mainnet: [{ address: '0xContract' }],
              },
            },
          },
          PreferencesController: {
            frequentRpcList: [],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.allTokens['0xAddress1']['1']).toStrictEqual([{ symbol: 'DAI' }]);
    expect(newState.engine.backgroundState.CollectiblesController.allCollectibles['0xAddress1']['1']).toStrictEqual([{ tokenId: '1' }]);
    expect(newState.engine.backgroundState.CollectiblesController.allCollectibleContracts['0xAddress1']['1']).toStrictEqual([{ address: '0xContract' }]);
  });

  it('should handle custom RPC networks via frequentRpcList', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {
              '0xAddress1': {
                customRpc: [{ symbol: 'CUSTOM' }],
              },
            },
          },
          CollectiblesController: {
            allCollectibles: {
              '0xAddress1': {
                customRpc: [],
              },
            },
            allCollectibleContracts: {
              '0xAddress1': {
                customRpc: [],
              },
            },
          },
          PreferencesController: {
            frequentRpcList: [{ chainId: '137' }],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.allTokens['0xAddress1']['137']).toStrictEqual([{ symbol: 'CUSTOM' }]);
  });

  it('should handle empty tokens', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {},
          },
          CollectiblesController: {
            allCollectibles: {},
            allCollectibleContracts: {},
          },
          PreferencesController: {
            frequentRpcList: [],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(newState.engine.backgroundState.TokensController.allTokens).toStrictEqual({});
  });
});
