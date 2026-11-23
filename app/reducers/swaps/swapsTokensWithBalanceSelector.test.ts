import { swapsTokensWithBalanceSelector } from './index';

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

// Pre-Set implementation, kept to assert identical output.
const referenceTokensWithBalance = (
  baseTokens: { address: string }[],
  balances: Record<string, number>,
) => {
  const tokensAddressesWithBalance = Object.entries(balances)
    .filter(([, balance]) => balance !== 0)
    .sort(([, a], [, b]) => (b <= a ? -1 : 1))
    .map(([address]) => address.toLowerCase());
  const tokensWithBalance = [];
  const originalTokens = [];
  for (const token of baseTokens) {
    if (tokensAddressesWithBalance.includes(token.address)) {
      tokensWithBalance.push(token);
    } else {
      originalTokens.push(token);
    }
    if (
      tokensWithBalance.length === tokensAddressesWithBalance.length &&
      tokensWithBalance.length + originalTokens.length >= 5
    ) {
      break;
    }
  }
  return [...tokensWithBalance, ...originalTokens].slice(
    0,
    Math.max(tokensWithBalance.length, 5),
  );
};

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

  it('returns every swaps token with a balance even beyond 5', () => {
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

  it('walks the whole list when a held token is not a swaps token', () => {
    const swapsTokens = Array.from({ length: 5000 }, (_, i) => swapsToken(i));
    const balances: Record<string, number> = { [addr(99999)]: 5 };
    for (let n = 4999; n > 4970; n--) {
      balances[addr(n)] = n;
    }
    const result = swapsTokensWithBalanceSelector(
      buildState({ swapsTokens, balances }),
    );

    expect(result).toHaveLength(29);
    expect(addresses(result)).toStrictEqual(
      addresses(referenceTokensWithBalance(swapsTokens, balances)),
    );
  });

  it('matches the previous Array.includes output for varied inputs', () => {
    const swapsTokens = Array.from({ length: 300 }, (_, i) => swapsToken(i));
    for (let seed = 1; seed <= 25; seed++) {
      const balances: Record<string, number> = {};
      for (let k = 0; k < seed; k++) {
        const n = (seed * 37 + k * 101) % 400;
        balances[n % 3 ? addr(n) : addr(n).toUpperCase().replace('0X', '0x')] =
          k % 4 === 0 ? 0 : (k * 13) % 7;
      }
      expect(
        addresses(
          swapsTokensWithBalanceSelector(buildState({ swapsTokens, balances })),
        ),
      ).toStrictEqual(
        addresses(referenceTokensWithBalance(swapsTokens, balances)),
      );
    }
  });

  it('returns an empty list when there are no tokens', () => {
    expect(
      swapsTokensWithBalanceSelector(buildState({ swapsTokens: [] })),
    ).toStrictEqual([]);
  });
});
