import migrate from './004';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  NetworksChainId: { mainnet: '1', goerli: '5' },
}));

describe('Migration #4', () => {
  it('should remap tokens and collectibles from network type to chain ID', () => {
    const oldState = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: {
              '0xaccount1': {
                mainnet: [{ address: '0xtoken1' }],
                customNetwork: [{ address: '0xtoken2' }],
              },
            },
          },
          CollectiblesController: {
            allCollectibles: {
              '0xaccount1': { mainnet: [{ address: '0xnft1' }] },
            },
            allCollectibleContracts: {
              '0xaccount1': { mainnet: [{ address: '0xcontract1' }] },
            },
          },
          PreferencesController: {
            frequentRpcList: [{ chainId: '100' }],
          },
        },
      },
    };

    const newState = migrate(oldState);

    expect(
      newState.engine.backgroundState.TokensController.allTokens,
    ).toStrictEqual({
      '0xaccount1': {
        '1': [{ address: '0xtoken1' }],
        '100': [{ address: '0xtoken2' }],
      },
    });
    expect(
      newState.engine.backgroundState.CollectiblesController.allCollectibles,
    ).toStrictEqual({
      '0xaccount1': { '1': [{ address: '0xnft1' }] },
    });
    expect(
      newState.engine.backgroundState.CollectiblesController
        .allCollectibleContracts,
    ).toStrictEqual({
      '0xaccount1': { '1': [{ address: '0xcontract1' }] },
    });
  });
});
