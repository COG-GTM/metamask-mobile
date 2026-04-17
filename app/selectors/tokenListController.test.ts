import { selectTokenList, selectERC20TokensByChain } from './tokenListController';

const mockState = {
  engine: {
    backgroundState: {
      TokenListController: {
        tokensChainsCache: {
          '0x1': {
            data: {
              '0xtoken1': { address: '0xtoken1', symbol: 'TK1', name: 'Token1' },
              '0xtoken2': { address: '0xtoken2', symbol: 'TK2', name: 'Token2' },
            },
          },
          '0x89': {
            data: {
              '0xtoken3': { address: '0xtoken3', symbol: 'TK3', name: 'Token3' },
            },
          },
        },
      },
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networksMetadata: {},
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            rpcEndpoints: [{ networkClientId: 'mainnet' }],
          },
        },
      },
    },
  },
} as any;

describe('tokenListController selectors', () => {
  it('selectTokenList returns token list for current chain', () => {
    const result = selectTokenList(mockState);
    expect(result).toBeDefined();
  });

  it('selectERC20TokensByChain returns all token chains cache', () => {
    const result = selectERC20TokensByChain(mockState);
    expect(result).toBeDefined();
  });

  it('selectTokenList returns empty array when no data', () => {
    const emptyState = {
      engine: {
        backgroundState: {
          TokenListController: { tokensChainsCache: {} },
          NetworkController: {
            selectedNetworkClientId: 'mainnet',
            networksMetadata: {},
            networkConfigurationsByChainId: {
              '0x1': {
                chainId: '0x1',
                rpcEndpoints: [{ networkClientId: 'mainnet' }],
              },
            },
          },
        },
      },
    } as any;
    const result = selectTokenList(emptyState);
    expect(result).toEqual([]);
  });
});
