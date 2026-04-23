import {
  getTotalEvmFiatAccountBalance,
  hasFunds,
  FiatBalanceResult,
} from './fiat-balance';
import type { EngineContext } from '../types';

const mockSelectedAccount = {
  id: 'test-account-id',
  address: '0x9DeE4BF1dE9E3b930E511Db5cEBEbC8d6F855Db0',
  type: 'eip155:eoa',
  options: {},
  methods: [],
  metadata: { name: 'Test Account', importTime: 0, keyring: { type: 'HD Key Tree' }, nameLastUpdatedAt: 0 },
  scopes: [],
};

const mockNetworkClientId = 'mainnet';

function createMockContext(overrides: Record<string, unknown> = {}): EngineContext {
  return {
    CurrencyRateController: {
      state: {
        currentCurrency: 'usd',
        currencyRates: {
          ETH: {
            conversionRate: 4000,
            conversionDate: 0,
            usdConversionRate: 4000,
          },
        },
      },
    },
    AccountsController: {
      getAccount: jest.fn().mockReturnValue(mockSelectedAccount),
      state: {
        internalAccounts: {
          selectedAccount: 'test-account-id',
          accounts: {
            'test-account-id': mockSelectedAccount,
          },
        },
      },
    },
    AccountTrackerController: {
      state: {
        accountsByChainId: {},
      },
    },
    TokenBalancesController: {
      state: {
        tokenBalances: {},
      },
    },
    TokenRatesController: {
      state: {
        marketData: {},
      },
    },
    TokensController: {
      state: {
        allTokens: {},
      },
    },
    NetworkController: {
      getNetworkClientById: jest.fn().mockReturnValue({
        configuration: {
          chainId: '0x1',
          ticker: 'ETH',
        },
      }),
      state: {
        selectedNetworkClientId: mockNetworkClientId,
        networkConfigurationsByChainId: {
          '0x1': {
            rpcEndpoints: [{ networkClientId: mockNetworkClientId }],
            defaultRpcEndpointIndex: 0,
          },
        },
      },
    },
    ...overrides,
  } as unknown as EngineContext;
}

describe('getTotalEvmFiatAccountBalance', () => {
  const mockGetState = () => ({ settings: { showFiatOnTestnets: false } });

  it('returns zero values when no balances exist', () => {
    const context = createMockContext();
    const result = getTotalEvmFiatAccountBalance(context, mockGetState);

    expect(result).toStrictEqual({
      ethFiat: 0,
      ethFiat1dAgo: 0,
      tokenFiat: 0,
      tokenFiat1dAgo: 0,
      totalNativeTokenBalance: '0',
      ticker: 'ETH',
    });
  });

  it('returns zero values when selectedInternalAccount is undefined', () => {
    const context = createMockContext({
      AccountsController: {
        getAccount: jest.fn().mockReturnValue(undefined),
        state: {
          internalAccounts: {
            selectedAccount: 'test-account-id',
            accounts: {},
          },
        },
      },
    });

    const result = getTotalEvmFiatAccountBalance(context, mockGetState);

    expect(result).toStrictEqual({
      ethFiat: 0,
      tokenFiat: 0,
      ethFiat1dAgo: 0,
      tokenFiat1dAgo: 0,
      totalNativeTokenBalance: '0',
      ticker: '',
    });
  });

  it('returns zero values on test networks when showFiatOnTestnets is false', () => {
    const context = createMockContext({
      NetworkController: {
        getNetworkClientById: jest.fn().mockReturnValue({
          configuration: {
            chainId: '0xaa36a7', // Sepolia testnet
            ticker: 'SepoliaETH',
          },
        }),
        state: {
          selectedNetworkClientId: mockNetworkClientId,
          networkConfigurationsByChainId: {
            '0xaa36a7': {
              rpcEndpoints: [{ networkClientId: mockNetworkClientId }],
              defaultRpcEndpointIndex: 0,
            },
          },
        },
      },
    });

    const result = getTotalEvmFiatAccountBalance(context, mockGetState);

    expect(result).toStrictEqual({
      ethFiat: 0,
      tokenFiat: 0,
      ethFiat1dAgo: 0,
      tokenFiat1dAgo: 0,
      totalNativeTokenBalance: '0',
      ticker: '',
    });
  });

  it('uses the provided account instead of selected account', () => {
    const customAccount = {
      ...mockSelectedAccount,
      id: 'custom-id',
      address: '0xCustomAddress',
    };
    const context = createMockContext();

    const result = getTotalEvmFiatAccountBalance(
      context,
      mockGetState,
      customAccount as Parameters<typeof getTotalEvmFiatAccountBalance>[2],
    );

    expect(result.ticker).toBe('ETH');
    expect(context.AccountsController.getAccount).not.toHaveBeenCalled();
  });
});

describe('hasFunds', () => {
  const defaultFiatBalance: FiatBalanceResult = {
    ethFiat: 0,
    ethFiat1dAgo: 0,
    tokenFiat: 0,
    tokenFiat1dAgo: 0,
    totalNativeTokenBalance: '0',
    ticker: '',
  };

  it('returns false when there are no funds', () => {
    const mockGetTotalBalance = jest.fn().mockReturnValue(defaultFiatBalance);
    const mockGetState = jest.fn().mockReturnValue({
      engine: {
        backgroundState: {
          NftController: { nfts: [] },
          TokenBalancesController: { tokenBalances: {} },
        },
      },
    });

    const result = hasFunds(mockGetTotalBalance, mockGetState);
    expect(result).toBe(false);
  });

  it('returns true when there is a positive fiat balance', () => {
    const mockGetTotalBalance = jest.fn().mockReturnValue({
      ...defaultFiatBalance,
      ethFiat: 1000,
    });
    const mockGetState = jest.fn().mockReturnValue({
      engine: {
        backgroundState: {
          NftController: { nfts: [] },
          TokenBalancesController: { tokenBalances: {} },
        },
      },
    });

    const result = hasFunds(mockGetTotalBalance, mockGetState);
    expect(result).toBe(true);
  });

  it('returns true when there are NFTs', () => {
    const mockGetTotalBalance = jest.fn().mockReturnValue(defaultFiatBalance);
    const mockGetState = jest.fn().mockReturnValue({
      engine: {
        backgroundState: {
          NftController: { nfts: [{ id: '1' }] },
          TokenBalancesController: { tokenBalances: {} },
        },
      },
    });

    const result = hasFunds(mockGetTotalBalance, mockGetState);
    expect(result).toBe(true);
  });

  it('returns true when there are non-zero token balances', () => {
    const mockGetTotalBalance = jest.fn().mockReturnValue(defaultFiatBalance);
    const mockGetState = jest.fn().mockReturnValue({
      engine: {
        backgroundState: {
          NftController: { nfts: [] },
          TokenBalancesController: {
            tokenBalances: {
              '0xAddress': {
                '0x1': {
                  '0xToken': '100',
                },
              },
            },
          },
        },
      },
    });

    const result = hasFunds(mockGetTotalBalance, mockGetState);
    expect(result).toBe(true);
  });

  it('returns undefined when an error occurs', () => {
    const mockGetTotalBalance = jest.fn().mockImplementation(() => {
      throw new Error('test error');
    });
    const mockGetState = jest.fn().mockReturnValue({
      engine: {
        backgroundState: {
          NftController: { nfts: [] },
          TokenBalancesController: { tokenBalances: {} },
        },
      },
    });

    const result = hasFunds(mockGetTotalBalance, mockGetState);
    expect(result).toBeUndefined();
  });
});
