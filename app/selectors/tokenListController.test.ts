import { RootState } from '../reducers';
import { selectERC20TokensByChain } from './tokenListController';

const mockDeepCompares = jest.fn();

jest.mock('lodash', () => {
  const actual = jest.requireActual('lodash');
  return {
    ...actual,
    isEqual: (a: unknown, b: unknown) => {
      if (a !== b) mockDeepCompares(a, b);
      return actual.isEqual(a, b);
    },
  };
});

let cacheVersion = 0;
const nextSymbol = () => `TKN${++cacheVersion}`;

const buildCache = (symbol: string) => ({
  '0x1': {
    timestamp: 1,
    data: {
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol,
        decimals: 6,
      },
    },
  },
});

const buildState = (
  tokensChainsCache: ReturnType<typeof buildCache>,
  preventPollingOnNetworkRestart = false,
) =>
  ({
    engine: {
      backgroundState: {
        TokenListController: {
          tokensChainsCache,
          preventPollingOnNetworkRestart,
        },
      },
    },
  } as unknown as RootState);

describe('selectERC20TokensByChain', () => {
  beforeEach(() => {
    mockDeepCompares.mockClear();
  });

  it('returns tokensChainsCache', () => {
    const cache = buildCache(nextSymbol());
    expect(selectERC20TokensByChain(buildState(cache))).toBe(cache);
  });

  it('does not deep compare when only other controller fields change', () => {
    const cache = buildCache(nextSymbol());
    const first = selectERC20TokensByChain(buildState(cache));
    mockDeepCompares.mockClear();

    const second = selectERC20TokensByChain(buildState(cache, true));

    expect(second).toBe(first);
    expect(mockDeepCompares).not.toHaveBeenCalled();
  });

  it('deep compares once and keeps the previous reference for an equal cache', () => {
    const symbol = nextSymbol();
    const first = selectERC20TokensByChain(buildState(buildCache(symbol)));
    mockDeepCompares.mockClear();

    const second = selectERC20TokensByChain(buildState(buildCache(symbol)));

    expect(second).toBe(first);
    expect(mockDeepCompares).toHaveBeenCalledTimes(1);
  });

  it('deep compares once and returns the new cache when its content changes', () => {
    selectERC20TokensByChain(buildState(buildCache(nextSymbol())));
    mockDeepCompares.mockClear();
    const changed = buildCache(nextSymbol());

    expect(selectERC20TokensByChain(buildState(changed))).toBe(changed);
    expect(mockDeepCompares).toHaveBeenCalledTimes(1);
  });

  it('returns undefined when TokenListController state is missing', () => {
    const state = {
      engine: { backgroundState: {} },
    } as unknown as RootState;
    expect(selectERC20TokensByChain(state)).toBeUndefined();
  });
});
