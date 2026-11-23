import { TokenListState } from '@metamask/assets-controllers';
import { isEqual } from 'lodash';
import { RootState } from '../reducers';
import {
  selectERC20TokensByChain,
  selectTokenList,
  selectTokenListArray,
} from './tokenListController';

jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  isEqual: jest.fn(jest.requireActual('lodash').isEqual),
}));

const buildTokenList = (chainId: string, count: number) =>
  Object.fromEntries(
    Array.from({ length: count }, (_, i) => {
      const address = `0x${chainId.slice(2)}${i.toString(16).padStart(8, '0')}`;
      return [
        address,
        {
          address,
          symbol: `T${i}`,
          name: `Token ${i}`,
          decimals: 18,
          aggregators: ['a', 'b'],
          occurrences: 2,
          iconUrl: `https://example.com/${address}.png`,
        },
      ];
    }),
  );

const buildState = (
  tokenListControllerState: Partial<TokenListState>,
  chainId = '0x1',
): RootState =>
  ({
    engine: {
      backgroundState: {
        TokenListController: tokenListControllerState,
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            [chainId]: {
              chainId,
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
              defaultRpcEndpointIndex: 0,
            },
          },
        },
      },
    },
  } as unknown as RootState);

// Other selectors (e.g. the chain id selector) may deep-compare small
// network state; only token list data must never be deep-compared.
const expectTokenListNotDeepCompared = () => {
  const tokenListCompares = jest
    .mocked(isEqual)
    .mock.calls.filter((args) => JSON.stringify(args).includes('"Token 0"'));
  expect(tokenListCompares).toHaveLength(0);
};

const buildCache = () => ({
  '0x1': { timestamp: 1, data: buildTokenList('0x1', 500) },
  '0x89': { timestamp: 1, data: buildTokenList('0x89', 500) },
});

describe('tokenListController selectors', () => {
  beforeEach(() => {
    jest.mocked(isEqual).mockClear();
  });

  describe('selectERC20TokensByChain', () => {
    it('returns tokensChainsCache by reference', () => {
      const tokensChainsCache = buildCache();
      const state = buildState({ tokensChainsCache });

      expect(selectERC20TokensByChain(state)).toBe(tokensChainsCache);
    });

    it('returns undefined when the controller state is missing', () => {
      const state = {
        engine: { backgroundState: {} },
      } as unknown as RootState;

      expect(selectERC20TokensByChain(state)).toBeUndefined();
    });

    it('returns the new cache when the controller state is replaced', () => {
      const first = buildCache();
      const second = buildCache();

      expect(
        selectERC20TokensByChain(buildState({ tokensChainsCache: first })),
      ).toBe(first);
      expect(
        selectERC20TokensByChain(buildState({ tokensChainsCache: second })),
      ).toBe(second);
    });

    it('does not deep-compare the token list cache on controller updates', () => {
      const tokensChainsCache = buildCache();
      selectERC20TokensByChain(buildState({ tokensChainsCache }));
      selectERC20TokensByChain(
        buildState({ tokensChainsCache, preventPollingOnNetworkRestart: true }),
      );
      selectERC20TokensByChain(buildState({ tokensChainsCache: buildCache() }));

      expectTokenListNotDeepCompared();
    });
  });

  describe('selectTokenList', () => {
    it('returns the current chain token list', () => {
      const tokensChainsCache = buildCache();
      expect(selectTokenList(buildState({ tokensChainsCache }, '0x89'))).toBe(
        tokensChainsCache['0x89'].data,
      );
    });

    it('returns a stable empty list when the chain is not cached', () => {
      const first = selectTokenList(
        buildState({ tokensChainsCache: buildCache() }, '0xa'),
      );
      const second = selectTokenList(
        buildState({ tokensChainsCache: buildCache() }, '0xa'),
      );

      expect(first).toEqual({});
      expect(second).toBe(first);
    });
  });

  describe('selectTokenListArray', () => {
    it('returns the current chain token list as an array', () => {
      const tokensChainsCache = buildCache();
      expect(
        selectTokenListArray(buildState({ tokensChainsCache }, '0x1')),
      ).toEqual(Object.values(tokensChainsCache['0x1'].data));
    });

    it('keeps the same array when another chain is refreshed', () => {
      const tokensChainsCache = buildCache();
      const first = selectTokenListArray(buildState({ tokensChainsCache }));
      const second = selectTokenListArray(
        buildState({
          tokensChainsCache: {
            ...tokensChainsCache,
            '0x89': { timestamp: 2, data: buildTokenList('0x89', 500) },
          },
        }),
      );

      expect(second).toBe(first);
      expectTokenListNotDeepCompared();
    });
  });
});
