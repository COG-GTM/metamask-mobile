import {
  DeepPartial,
  renderHookWithProvider,
} from '../../util/test/renderWithProvider';
import { backgroundState } from '../../util/test/initial-root-state';
import { RootState } from '../../reducers';
import {
  clearFormattedTokensPerChainCache,
  useGetFormattedTokensPerChain,
} from './useGetFormattedTokensPerChain';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  balanceToFiatNumber,
  renderFromTokenMinimalUnit,
} from '../../util/number';

jest.mock('../../util/number', () => {
  const actual = jest.requireActual('../../util/number');
  return {
    ...actual,
    renderFromTokenMinimalUnit: jest.fn(actual.renderFromTokenMinimalUnit),
    balanceToFiatNumber: jest.fn(actual.balanceToFiatNumber),
  };
});

const mockInitialState: DeepPartial<RootState> = {
  settings: {},
  engine: {
    backgroundState: {
      ...backgroundState,
      TokensController: {
        allTokens: {
          '0x1': {
            '0x2990079bcdee240329a520d2444386fc119da21a': [
              {
                address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                symbol: 'USDC',
                decimals: 6,
              },
              {
                address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                symbol: 'DAI',
                decimals: 18,
              },
            ],
          },
          '0xe708': {
            '0x2990079bcdee240329a520d2444386fc119da21a': [
              {
                address: '0x0D1E753a25eBda689453309112904807625bEFBe',
                symbol: 'CAKE',
                decimals: 18,
                image:
                  'https://static.cx.metamask.io/api/v1/tokenIcons/59144/0x0d1e753a25ebda689453309112904807625befbe.png',
                aggregators: ['CoinGecko', 'Lifi', 'Rubic'],
              },
            ],
          },
        },
      },
      TokenBalancesController: {
        tokenBalances: {
          '0x2990079bcdee240329a520d2444386fc119da21a': {
            '0x1': {
              '0x6B175474E89094C44Da98b954EedeAC495271d0F':
                '0x378afc9a77b47a30', //ok
              '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '0x2f18e6', //ok
            },
            '0xe708': {
              '0x0D1E753a25eBda689453309112904807625bEFBe': '0x5d512b2498936', //ok
            },
          },
        },
      },
      TokenRatesController: {
        marketData: {
          '0x1': {
            '0x0000000000000000000000000000000000000000': {
              allTimeHigh: 1.358362139899041,
              allTimeLow: 0.00012056394718021321,
              circulatingSupply: 120437986.49282,
              currency: 'ETH',
              dilutedMarketCap: 120403090.6888752,
              high1d: 1.0129617001531137,
              low1d: 0.9841725290871677,
              marketCap: 120403090.6888752,
              marketCapPercentChange1d: -0.50946,
              price: 0.9999691213549994,
            },
            '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
              allTimeHigh: 0.00033971166167379965,
              allTimeLow: 0.0002455836861719872,
              circulatingSupply: 3515355095.30133,
              currency: 'ETH',
              dilutedMarketCap: 980322.1154301534,
              high1d: 0.0002792875382449353,
              low1d: 0.00027781396929937977,
              marketCap: 980322.1154301534,
              marketCapPercentChange1d: 0.72619,
              price: 0.0002787306338815356,
            },
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
              allTimeHigh: 0.00032578905258880787,
              allTimeLow: 0.0002443827219123158,
              circulatingSupply: 39426638449.1676,
              currency: 'ETH',
              dilutedMarketCap: 10994675.226936838,
              high1d: 0.0002792875382449353,
              low1d: 0.00027787606413589883,
              marketCap: 10993585.422458814,
              marketCapPercentChange1d: 0.02655,
              price: 0.0002787306338815356,
            },
          },
          '0xe708': {
            '0x0000000000000000000000000000000000000000': {
              allTimeHigh: 1.358362139899041,
              allTimeLow: 0.00012056394718021321,
              circulatingSupply: 120437986.49282,
              currency: 'ETH',
              dilutedMarketCap: 120403090.6888752,
              high1d: 1.0129617001531137,
              low1d: 0.9841725290871677,
              marketCap: 120403090.6888752,
              marketCapPercentChange1d: -0.50946,
              price: 0.9999691213549994,
            },
            '0x0D1E753a25eBda689453309112904807625bEFBe': {
              allTimeHigh: 0.012240757907524782,
              allTimeLow: 0.00005414252066189777,
              circulatingSupply: 285758585.383924,
              currency: 'ETH',
              dilutedMarketCap: 324034.19013549044,
              high1d: 0.0008659862850864894,
              low1d: 0.000824218457831514,
              marketCap: 242784.4478787338,
              marketCapPercentChange1d: -1.28481,
              price: 0.0008492791541844991,
            },
          },
        },
      },
      CurrencyRateController: {
        currentCurrency: 'usd',
        currencyRates: {
          ETH: {
            conversionDate: 1732887955.694,
            conversionRate: 3596.25,
            usdConversionRate: 3596.25,
          },
          LineaETH: {
            conversionDate: 1732887955.694,
            conversionRate: 3596.25,
            usdConversionRate: 3596.25,
          },
        },
      },
    },
  },
};

let mockState = mockInitialState;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (fn: any) => fn(mockState),
}));

const ACCOUNT = '0x2990079bcdee240329a520d2444386fc119da21a';
const CAKE = '0x0D1E753a25eBda689453309112904807625bEFBe';
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyState = any;

const withBackgroundState = (
  state: AnyState,
  update: (backgroundState: AnyState) => AnyState,
): AnyState => ({
  ...state,
  engine: {
    ...state.engine,
    backgroundState: update(state.engine.backgroundState),
  },
});

// Mirrors Immer: only the touched path gets new references.
const withTokenBalance = (
  state: AnyState,
  chainId: string,
  tokenAddress: string,
  hexBalance: string,
) =>
  withBackgroundState(state, (bg) => ({
    ...bg,
    TokenBalancesController: {
      tokenBalances: {
        ...bg.TokenBalancesController.tokenBalances,
        [ACCOUNT]: {
          ...bg.TokenBalancesController.tokenBalances[ACCOUNT],
          [chainId]: {
            ...bg.TokenBalancesController.tokenBalances[ACCOUNT][chainId],
            [tokenAddress]: hexBalance,
          },
        },
      },
    },
  }));

const withTokenPrice = (
  state: AnyState,
  chainId: string,
  tokenAddress: string,
  price: number,
) =>
  withBackgroundState(state, (bg) => ({
    ...bg,
    TokenRatesController: {
      marketData: {
        ...bg.TokenRatesController.marketData,
        [chainId]: {
          ...bg.TokenRatesController.marketData[chainId],
          [tokenAddress]: {
            ...bg.TokenRatesController.marketData[chainId][tokenAddress],
            price,
          },
        },
      },
    },
  }));

const withConversionRate = (state: AnyState, conversionRate: number) =>
  withBackgroundState(state, (bg) => ({
    ...bg,
    CurrencyRateController: {
      ...bg.CurrencyRateController,
      currencyRates: {
        ...bg.CurrencyRateController.currencyRates,
        ETH: { ...bg.CurrencyRateController.currencyRates.ETH, conversionRate },
      },
    },
  }));

const renderAggregated = () =>
  renderHookWithProvider(
    () =>
      useGetFormattedTokensPerChain(
        [{ address: ACCOUNT } as InternalAccount],
        true,
        ['0x1', '0xe708'],
      ),
    { state: mockInitialState },
  );

const mockRenderFromTokenMinimalUnit = jest.mocked(renderFromTokenMinimalUnit);
const mockBalanceToFiatNumber = jest.mocked(balanceToFiatNumber);

describe('useGetFormattedTokensPerChain', () => {
  beforeEach(() => {
    mockState = mockInitialState;
    clearFormattedTokensPerChainCache();
    jest.clearAllMocks();
  });

  it('should return tokens formatted for each chain', async () => {
    const testChains = ['0x1', '0xe708'];
    const testAccount = {
      address: '0x2990079bcdee240329a520d2444386fc119da21a',
    };
    const expectedResult = {
      [testAccount.address]: [
        {
          chainId: '0x1',
          tokensWithBalances: [
            {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              symbol: 'USDC',
              decimals: 6,
              balance: '3.08657',
              tokenBalanceFiat: 3.09,
            },
            {
              address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              symbol: 'DAI',
              decimals: 18,
              balance: '4.00229',
              tokenBalanceFiat: 4.01,
            },
          ],
        },
      ],
    };

    const { result } = renderHookWithProvider(
      () =>
        useGetFormattedTokensPerChain(
          [testAccount as InternalAccount],
          false,
          testChains,
        ),
      {
        state: mockInitialState,
      },
    );

    // Note, we are currently only aggregating for popular networks
    expect(result.current).toEqual(expectedResult);
  });

  it('only reformats the token whose balance changed', () => {
    const { result, rerender } = renderAggregated();
    const [mainnetBefore, lineaBefore] = result.current[ACCOUNT];
    expect(mockRenderFromTokenMinimalUnit).toHaveBeenCalledTimes(3);
    mockRenderFromTokenMinimalUnit.mockClear();
    mockBalanceToFiatNumber.mockClear();

    mockState = withTokenBalance(
      mockState,
      '0xe708',
      CAKE,
      '0xde0b6b3a7640000',
    );
    rerender({});

    const [mainnetAfter, lineaAfter] = result.current[ACCOUNT];
    expect(mockRenderFromTokenMinimalUnit).toHaveBeenCalledTimes(1);
    expect(mockBalanceToFiatNumber).toHaveBeenCalledTimes(1);
    expect(mainnetAfter).toBe(mainnetBefore);
    expect(lineaAfter).not.toBe(lineaBefore);
    expect(lineaAfter.tokensWithBalances).toEqual([
      expect.objectContaining({
        address: CAKE,
        balance: '1',
        tokenBalanceFiat: 3.05,
      }),
    ]);
  });

  it('recomputes only fiat for a price change, without BN formatting', () => {
    const { result, rerender } = renderAggregated();
    const [mainnetBefore, lineaBefore] = result.current[ACCOUNT];
    mockRenderFromTokenMinimalUnit.mockClear();
    mockBalanceToFiatNumber.mockClear();

    mockState = withTokenPrice(mockState, '0x1', DAI, 0.0005);
    rerender({});

    const [mainnetAfter, lineaAfter] = result.current[ACCOUNT];
    expect(mockRenderFromTokenMinimalUnit).not.toHaveBeenCalled();
    expect(mockBalanceToFiatNumber).toHaveBeenCalledTimes(1);
    expect(lineaAfter).toBe(lineaBefore);
    expect(mainnetAfter.tokensWithBalances[0]).toBe(
      mainnetBefore.tokensWithBalances[0],
    );
    expect(mainnetAfter.tokensWithBalances[1]).toEqual({
      address: DAI,
      symbol: 'DAI',
      decimals: 18,
      balance: '4.00229',
      tokenBalanceFiat: 7.19,
    });
  });

  it('recomputes fiat but not balances when the conversion rate changes', () => {
    const { result, rerender } = renderAggregated();
    mockRenderFromTokenMinimalUnit.mockClear();
    mockBalanceToFiatNumber.mockClear();

    mockState = withConversionRate(mockState, 1000);
    rerender({});

    expect(mockRenderFromTokenMinimalUnit).not.toHaveBeenCalled();
    // Mainnet and Linea both use the ETH rate: one fiat call per token.
    expect(mockBalanceToFiatNumber).toHaveBeenCalledTimes(3);
    expect(
      result.current[ACCOUNT][0].tokensWithBalances.map(
        (token) => token.tokenBalanceFiat,
      ),
    ).toEqual([0.86, 1.11]);
    expect(result.current[ACCOUNT][1].tokensWithBalances[0].balance).toBe(
      '0.00164',
    );
  });

  it('returns the same result object when inputs are deep-equal but new references', () => {
    const { result, rerender } = renderAggregated();
    const before = result.current;
    mockRenderFromTokenMinimalUnit.mockClear();
    mockBalanceToFiatNumber.mockClear();

    mockState = JSON.parse(JSON.stringify(mockState));
    rerender({});

    expect(result.current).toBe(before);
    expect(mockRenderFromTokenMinimalUnit).not.toHaveBeenCalled();
    expect(mockBalanceToFiatNumber).not.toHaveBeenCalled();
  });

  it('shares formatted results between hook consumers', () => {
    const first = renderAggregated();
    mockRenderFromTokenMinimalUnit.mockClear();

    const second = renderAggregated();

    expect(mockRenderFromTokenMinimalUnit).not.toHaveBeenCalled();
    expect(second.result.current[ACCOUNT]).toEqual(
      first.result.current[ACCOUNT],
    );
    expect(second.result.current[ACCOUNT][0]).toBe(
      first.result.current[ACCOUNT][0],
    );
  });

  it('matches a full recomputation after several incremental updates', () => {
    const { result, rerender } = renderAggregated();

    mockState = withTokenBalance(mockState, '0x1', DAI, '0x1bc16d674ec80000');
    rerender({});
    mockState = withTokenPrice(mockState, '0xe708', CAKE, 0.001);
    rerender({});
    mockState = withConversionRate(mockState, 2000);
    rerender({});
    const incremental = result.current;

    clearFormattedTokensPerChainCache();
    const fresh = renderAggregated();

    expect(incremental).toEqual(fresh.result.current);
  });
});
