import { selectTokenList, selectERC20TokensByChain } from './tokenListController';

jest.mock('../util/tokens', () => ({
  tokenListToArray: (list: any) => (Array.isArray(list) ? list : Object.values(list || {})),
}));

describe('TokenListController Selectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        TokenListController: {
          tokensChainsCache: {
            '0x1': {
              data: [
                { address: '0xToken1', symbol: 'TK1' },
                { address: '0xToken2', symbol: 'TK2' },
              ],
            },
          },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
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

  it('selectTokenList should return token list for current chain', () => {
    const result = selectTokenList(mockState);
    expect(result).toHaveLength(2);
    expect(result[0].symbol).toBe('TK1');
  });

  it('selectTokenList should return empty array for missing chain', () => {
    const state = {
      ...mockState,
      engine: {
        backgroundState: {
          ...mockState.engine.backgroundState,
          NetworkController: {
            selectedNetworkClientId: 'unknown',
            networkConfigurationsByChainId: {
              '0x999': {
                chainId: '0x999',
                rpcEndpoints: [{ networkClientId: 'unknown' }],
              },
            },
          },
        },
      },
    };
    const result = selectTokenList(state);
    expect(result).toStrictEqual([]);
  });

  it('selectERC20TokensByChain should return tokens chains cache', () => {
    const result = selectERC20TokensByChain(mockState);
    expect(result).toHaveProperty('0x1');
  });
});
