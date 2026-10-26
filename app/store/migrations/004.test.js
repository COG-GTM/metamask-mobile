import { NetworksChainId } from '@metamask/controller-utils';
import migrate from './004';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  NetworksChainId: { mainnet: '1', goerli: '5', rpc: '' },
}));

describe('Migration #004', () => {
  it('re-keys tokens and collectibles by chainId', () => {
    const state = {
      engine: {
        backgroundState: {
          TokensController: {
            allTokens: { '0xa': { mainnet: ['t1'], rpc: ['t2'] } },
            other: true,
          },
          CollectiblesController: {
            allCollectibles: { '0xa': { goerli: ['c1'], rpc: ['c2'] } },
            allCollectibleContracts: {
              '0xa': { mainnet: ['cc1'], rpc: ['cc2'] },
            },
          },
          PreferencesController: {
            frequentRpcList: [{ chainId: '1337' }, { chainId: '100' }],
          },
        },
      },
    };
    const { TokensController, CollectiblesController } =
      migrate(state).engine.backgroundState;

    expect(TokensController).toEqual({
      other: true,
      allTokens: {
        '0xa': {
          [NetworksChainId.mainnet]: ['t1'],
          '1337': ['t2'],
          '100': ['t2'],
        },
      },
    });
    expect(CollectiblesController.allCollectibles).toEqual({
      '0xa': {
        [NetworksChainId.goerli]: ['c1'],
        '1337': ['c2'],
        '100': ['c2'],
      },
    });
    expect(CollectiblesController.allCollectibleContracts).toEqual({
      '0xa': {
        [NetworksChainId.mainnet]: ['cc1'],
        '1337': ['cc2'],
        '100': ['cc2'],
      },
    });
  });
});
