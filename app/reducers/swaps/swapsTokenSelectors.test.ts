import {
  swapsTokensWithBalanceSelector,
  swapsTopAssetsSelector,
  swapsTokensMultiChainObjectSelector,
} from './index';

interface MockState {
  chainId: string;
  tokens: { address: string; symbol: string; decimals: number }[];
  allTokens: Record<string, Record<string, unknown[]>>;
  selectedAddress: string;
  tokenList: Record<string, { name: string }>;
  balances: Record<string, number>;
}

jest.mock('../../selectors/tokensController', () => ({
  selectTokens: (state: { mock: MockState }) => state.mock.tokens,
  selectAllTokens: (state: { mock: MockState }) => state.mock.allTokens,
}));
jest.mock('../../selectors/tokenListController', () => ({
  selectTokenList: (state: { mock: MockState }) => state.mock.tokenList,
}));
jest.mock('../../selectors/tokenBalancesController', () => ({
  selectContractBalances: (state: { mock: MockState }) => state.mock.balances,
}));
jest.mock('../../selectors/networkController', () => ({
  selectEvmChainId: (state: { mock: MockState }) => state.mock.chainId,
}));
jest.mock('../../selectors/accountsController', () => ({
  selectSelectedInternalAccountAddress: (state: { mock: MockState }) =>
    state.mock.selectedAddress,
}));

const POLYGON = '0x89';
const USER = '0xUser';
const addr = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;
const swapsToken = (n: number) => ({
  address: addr(n),
  symbol: `T${n}`,
  decimals: 18,
  occurrences: 1,
});

const buildState = ({
  swapsTokens = [] as ReturnType<typeof swapsToken>[],
  topAssets = [] as { address?: string; symbol?: string }[],
  balances = {} as Record<string, number>,
  tokens = [] as MockState['tokens'],
  allTokens = {} as MockState['allTokens'],
  chainId = POLYGON,
  tokenList = {} as MockState['tokenList'],
}) => ({
  engine: {
    backgroundState: {
      SwapsController: { tokens: swapsTokens, topAssets },
    },
  },
  mock: {
    chainId,
    tokens,
    allTokens,
    selectedAddress: USER,
    tokenList,
    balances,
  },
});

const addresses = (tokens: { address: string }[]) =>
  tokens.map(({ address }) => address);

describe('swapsTokensWithBalanceSelector', () => {
  it('puts tokens with a balance first, then fills up to 5 tokens', () => {
    const swapsTokens = Array.from({ length: 20 }, (_, i) => swapsToken(i));
    const state = buildState({
      swapsTokens,
      balances: {
        [addr(12).toUpperCase().replace('0X', '0x')]: 3,
        [addr(7)]: 9,
        [addr(3)]: 0,
      },
    });

    expect(addresses(swapsTokensWithBalanceSelector(state))).toStrictEqual([
      addr(7),
      addr(12),
      addr(0),
      addr(1),
      addr(2),
    ]);
  });

  it('returns every token with a balance even beyond 5', () => {
    const swapsTokens = Array.from({ length: 50 }, (_, i) => swapsToken(i));
    const withBalance = [40, 30, 20, 10, 5, 1, 49];
    const balances = Object.fromEntries(withBalance.map((n) => [addr(n), 1]));
    const result = swapsTokensWithBalanceSelector(
      buildState({ swapsTokens, balances }),
    );

    expect(result).toHaveLength(withBalance.length);
    expect(new Set(addresses(result))).toStrictEqual(
      new Set(withBalance.map(addr)),
    );
  });

  it('returns an empty list when there are no tokens', () => {
    expect(
      swapsTokensWithBalanceSelector(buildState({ swapsTokens: [] })),
    ).toStrictEqual([]);
  });
});

describe('swapsTopAssetsSelector', () => {
  it('maps top assets to swaps tokens case-insensitively, in top-asset order', () => {
    const swapsTokens = [swapsToken(1), swapsToken(2), swapsToken(3)];
    const state = buildState({
      swapsTokens,
      topAssets: [
        { address: addr(3).toUpperCase().replace('0X', '0x') },
        { address: addr(99) },
        {},
        { address: addr(1) },
      ],
    });

    expect(addresses(swapsTopAssetsSelector(state))).toStrictEqual([
      addr(3),
      addr(1),
    ]);
  });

  it('adds token list names on mainnet', () => {
    const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const state = buildState({
      chainId: '0x1',
      swapsTokens: [
        { ...swapsToken(1), address: usdc.toLowerCase(), symbol: 'USDC' },
      ],
      topAssets: [{ address: usdc }],
      tokenList: { [usdc]: { name: 'USD Coin' } },
    });

    expect(swapsTopAssetsSelector(state)).toStrictEqual([
      expect.objectContaining({
        address: usdc.toLowerCase(),
        name: 'USD Coin',
      }),
    ]);
  });

  it('returns an empty list without top assets', () => {
    expect(
      swapsTopAssetsSelector(buildState({ swapsTokens: [swapsToken(1)] })),
    ).toStrictEqual([]);
  });
});

describe('swapsTokensMultiChainObjectSelector', () => {
  it('combines swaps tokens with the user tokens of every chain', () => {
    const state = buildState({
      swapsTokens: [swapsToken(1)],
      allTokens: {
        '0x1': { [USER]: [swapsToken(2), swapsToken(1)] },
        '0x89': { [USER]: [swapsToken(3)], '0xOther': [swapsToken(4)] },
        '0xa': {},
      },
    });

    expect(swapsTokensMultiChainObjectSelector(state)).toStrictEqual({
      [addr(1)]: undefined,
      [addr(2)]: undefined,
      [addr(3)]: undefined,
    });
  });
});
