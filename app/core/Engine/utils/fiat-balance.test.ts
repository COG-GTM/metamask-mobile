import { Hex } from '@metamask/utils';
import { getTotalEvmFiatAccountBalance, hasFunds } from './fiat-balance';
import type { EngineContext } from '../types';

// Mock dependencies
jest.mock('../../../util/number', () => ({
  renderFromTokenMinimalUnit: jest.fn(() => '100'),
  balanceToFiatNumber: jest.fn(() => 50),
  weiToFiatNumber: jest.fn(() => 200),
  toHexadecimal: jest.fn((v: string) => v),
  hexToBN: jest.fn(() => ({
    add: jest.fn().mockReturnValue({
      toString: jest.fn(() => 'abc123'),
    }),
  })),
  renderFromWei: jest.fn(() => '1.5'),
}));

jest.mock('../../../util/networks', () => ({
  isTestNet: jest.fn(() => false),
}));

jest.mock('../../../util/lodash', () => ({
  isZero: jest.fn((v: string) => v === '0x0' || v === '0'),
}));

jest.mock('../../../util/networks/global-network', () => ({
  getGlobalNetworkClientId: jest.fn(() => 'mainnet'),
}));

jest.mock('../../../util/address', () => ({
  toFormattedAddress: jest.fn((addr: string) => addr),
}));

jest.mock('../../../store', () => ({
  store: {
    getState: jest.fn(() => ({
      settings: { showFiatOnTestnets: false },
      engine: {
        backgroundState: {
          NftController: { nfts: [] },
          TokenBalancesController: {
            tokenBalances: {},
          },
        },
      },
    })),
  },
}));

jest.mock('../../../util/Logger', () => ({
  __esModule: true,
  default: { log: jest.fn() },
}));

jest.mock('ethereumjs-util', () => ({
  zeroAddress: jest.fn(() => '0x0000000000000000000000000000000000000000'),
}));

const { isTestNet } = jest.requireMock('../../../util/networks');
const { isZero } = jest.requireMock('../../../util/lodash');
const { store } = jest.requireMock('../../../store');

function buildMockContext(overrides?: Partial<EngineContext>): EngineContext {
  return {
    CurrencyRateController: {
      state: {
        currentCurrency: 'usd',
        currencyRates: {
          ETH: { conversionRate: 2000 },
        },
      },
    },
    AccountsController: {
      state: {
        internalAccounts: {
          selectedAccount: 'account-1',
        },
      },
      getAccount: jest.fn(() => ({
        address: '0xABC',
      })),
    },
    AccountTrackerController: {
      state: {
        accountsByChainId: {
          '0x1': {
            '0xABC': {
              balance: '0x1000',
              stakedBalance: '0x100',
            },
          },
        },
      },
    },
    TokenBalancesController: {
      state: {
        tokenBalances: {
          '0xABC': {
            '0x1': {
              '0xToken1': '0x500',
            },
          },
        },
      },
    },
    TokenRatesController: {
      state: {
        marketData: {
          '0x1': {
            '0x0000000000000000000000000000000000000000': {
              pricePercentChange1d: 5,
            },
            '0xToken1': {
              price: 1.5,
              pricePercentChange1d: 10,
            },
          },
        },
      },
    },
    TokensController: {
      state: {
        allTokens: {
          '0x1': {
            '0xABC': [
              { address: '0xToken1', decimals: 18 },
            ],
          },
        },
      },
    },
    NetworkController: {
      getNetworkClientById: jest.fn(() => ({
        configuration: {
          chainId: '0x1',
          ticker: 'ETH',
        },
      })),
    },
    ...overrides,
  } as unknown as EngineContext;
}

describe('getTotalEvmFiatAccountBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isTestNet as jest.Mock).mockReturnValue(false);
  });

  it('returns zero balance when no account is found', () => {
    const context = buildMockContext({
      AccountsController: {
        state: {
          internalAccounts: { selectedAccount: 'nonexistent' },
        },
        getAccount: jest.fn(() => null),
      } as unknown as EngineContext['AccountsController'],
    });

    const result = getTotalEvmFiatAccountBalance(context);
    expect(result.ethFiat).toBe(0);
    expect(result.tokenFiat).toBe(0);
    expect(result.totalNativeTokenBalance).toBe('0');
  });

  it('returns zero balance on testnet when showFiatOnTestnets is false', () => {
    (isTestNet as jest.Mock).mockReturnValue(true);
    const context = buildMockContext();

    const result = getTotalEvmFiatAccountBalance(context);
    expect(result.ethFiat).toBe(0);
    expect(result.tokenFiat).toBe(0);
  });

  it('calculates ethFiat from account balance', () => {
    const context = buildMockContext();
    const result = getTotalEvmFiatAccountBalance(context);

    expect(result.ethFiat).toBe(200);
    expect(result.totalNativeTokenBalance).toBe('1.5');
    expect(result.ticker).toBe('ETH');
  });

  it('calculates tokenFiat from token balances', () => {
    const context = buildMockContext();
    const result = getTotalEvmFiatAccountBalance(context);

    expect(result.tokenFiat).toBe(50);
  });

  it('computes ethFiat1dAgo using price percent change', () => {
    const context = buildMockContext();
    const result = getTotalEvmFiatAccountBalance(context);

    // ethFiat=200, pricePercentChange1d=5 => 200 / (1 + 5/100) = 200/1.05
    const expected = 200 / 1.05;
    expect(result.ethFiat1dAgo).toBeCloseTo(expected, 2);
  });

  it('uses provided account instead of selected account', () => {
    const context = buildMockContext();
    const customAccount = { address: '0xABC' } as never;

    getTotalEvmFiatAccountBalance(context, customAccount);

    expect(context.AccountsController.getAccount).not.toHaveBeenCalled();
  });
});

describe('hasFunds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isTestNet as jest.Mock).mockReturnValue(false);
    (isZero as jest.Mock).mockImplementation(
      (v: string) => v === '0x0' || v === '0',
    );
  });

  it('returns true when fiat balance is positive', () => {
    store.getState.mockReturnValue({
      settings: { showFiatOnTestnets: false },
      engine: {
        backgroundState: {
          NftController: { nfts: [] },
          TokenBalancesController: {
            tokenBalances: {},
          },
        },
      },
    });

    const context = buildMockContext();
    const result = hasFunds(context);
    expect(result).toBe(true);
  });

  it('returns true when non-zero token balance is found', () => {
    store.getState.mockReturnValue({
      settings: { showFiatOnTestnets: false },
      engine: {
        backgroundState: {
          NftController: { nfts: [] },
          TokenBalancesController: {
            tokenBalances: {
              '0xABC': {
                '0x1': {
                  '0xToken1': '0x500',
                },
              },
            },
          },
        },
      },
    });

    // Build context that returns zero fiat
    const context = buildMockContext({
      AccountsController: {
        state: {
          internalAccounts: { selectedAccount: 'nonexistent' },
        },
        getAccount: jest.fn(() => null),
      } as unknown as EngineContext['AccountsController'],
    });

    const result = hasFunds(context);
    expect(result).toBe(true);
  });

  it('returns true when NFTs are present', () => {
    store.getState.mockReturnValue({
      settings: { showFiatOnTestnets: false },
      engine: {
        backgroundState: {
          NftController: { nfts: [{ tokenId: '1' }] },
          TokenBalancesController: {
            tokenBalances: {},
          },
        },
      },
    });

    const context = buildMockContext({
      AccountsController: {
        state: {
          internalAccounts: { selectedAccount: 'nonexistent' },
        },
        getAccount: jest.fn(() => null),
      } as unknown as EngineContext['AccountsController'],
    });

    const result = hasFunds(context);
    expect(result).toBe(true);
  });

  it('returns undefined when an error is thrown', () => {
    store.getState.mockImplementation(() => {
      throw new Error('store error');
    });

    const context = buildMockContext();
    const result = hasFunds(context);
    expect(result).toBeUndefined();
  });
});
