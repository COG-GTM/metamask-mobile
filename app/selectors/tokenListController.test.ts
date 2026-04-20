import {
  selectERC20TokensByChain,
  selectTokenList,
  selectTokenListArray,
} from './tokenListController';
import type { RootState } from '../reducers';

const makeState = (
  chainId: string,
  data: unknown[] | undefined,
  extraTokensChainsCache: Record<string, { data: unknown[] }> = {},
) =>
  ({
    engine: {
      backgroundState: {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            [chainId]: {
              chainId,
              rpcEndpoints: [
                {
                  networkClientId: 'mainnet',
                  url: 'https://rpc',
                  type: 'custom',
                },
              ],
              defaultRpcEndpointIndex: 0,
            },
          },
        },
        TokenListController: {
          tokensChainsCache: {
            ...(data !== undefined ? { [chainId]: { data } } : {}),
            ...extraTokensChainsCache,
          },
        },
      },
    },
  } as unknown as RootState);

describe('tokenListController selectors', () => {
  it('selectTokenList returns the tokensChainsCache[chainId].data array', () => {
    const data = [{ address: '0x1', symbol: 'A' }];
    expect(selectTokenList(makeState('0x1', data))).toEqual(data);
  });

  it('selectTokenList falls back to [] when no entry exists for the chain', () => {
    expect(selectTokenList(makeState('0x1', undefined))).toEqual([]);
  });

  it('selectTokenListArray materializes the token list', () => {
    const data = [
      { address: '0xa', symbol: 'A', decimals: 1 },
      { address: '0xb', symbol: 'B', decimals: 2 },
    ];
    const result = selectTokenListArray(makeState('0x1', data));
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('selectERC20TokensByChain returns the full tokensChainsCache', () => {
    const cache = {
      '0x1': { data: [{ address: '0xa', symbol: 'A' }] },
      '0xa4b1': { data: [{ address: '0xb', symbol: 'B' }] },
    };
    const state = makeState('0x1', cache['0x1'].data, {
      '0xa4b1': cache['0xa4b1'],
    });
    expect(selectERC20TokensByChain(state)).toEqual(cache);
  });
});
