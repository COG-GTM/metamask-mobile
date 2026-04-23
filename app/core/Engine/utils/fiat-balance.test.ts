import { MarketDataDetails } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { zeroAddress } from 'ethereumjs-util';
import {
  createMockAccountsControllerState,
  createMockInternalAccount,
} from '../../../util/test/accountsControllerTestUtils';
import { mockNetworkState } from '../../../util/test/network';
import { getTotalEvmFiatAccountBalance, hasFunds } from './fiat-balance';

jest.mock('../../../util/networks/global-network', () => ({
  getGlobalNetworkClientId: (networkController: {
    state: { selectedNetworkClientId: string };
  }) => networkController.state.selectedNetworkClientId,
}));

const selectedAddress = '0x9DeE4BF1dE9E3b930E511Db5cEBEbC8d6F855Db0';
const selectedAccountId = 'test-account-id';
const chainId: Hex = '0x1';
const ticker = 'ETH';
const ethConversionRate = 4000;
const ethBalance = 1;
const stakedEthBalance = 1;

const mockAccount = createMockInternalAccount(
  selectedAddress,
  'Test Account',
);

function buildMockContext(overrides: Record<string, unknown> = {}) {
  const accountsState = {
    ...createMockAccountsControllerState(
      [selectedAddress],
      selectedAddress,
    ),
    internalAccounts: {
      accounts: {
        [selectedAccountId]: mockAccount,
      },
      selectedAccount: selectedAccountId,
    },
  };

  const networkState = mockNetworkState({
    chainId: '0x1',
    id: '0x1',
    nickname: 'mainnet',
    ticker: 'ETH',
  });

  return {
    CurrencyRateController: {
      state: {
        currentCurrency: 'usd',
        currencyRates: {
          [ticker]: {
            conversionRate: ethConversionRate,
            conversionDate: 0,
            usdConversionRate: ethConversionRate,
          },
        },
      },
    },
    AccountsController: {
      state: accountsState,
      getAccount: (id: string) => accountsState.internalAccounts.accounts[id],
    },
    AccountTrackerController: {
      state: {
        accountsByChainId: {
          [chainId]: {
            [selectedAddress]: { balance: (ethBalance * 1e18).toString() },
          },
        },
      },
    },
    TokenBalancesController: {
      state: { tokenBalances: {} },
    },
    TokenRatesController: {
      state: { marketData: {} },
    },
    TokensController: {
      state: { allTokens: {} },
    },
    NetworkController: {
      state: networkState,
      getNetworkClientById: (clientId: string) => {
        const config = Object.values(
          networkState.networkConfigurationsByChainId,
        ).find((c) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c as any).rpcEndpoints?.some(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (e: any) => e.networkClientId === clientId,
          ),
        );
        return {
          configuration: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            chainId: (config as any)?.chainId ?? '0x1',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ticker: (config as any)?.nativeCurrency ?? 'ETH',
          },
        };
      },
    },
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function buildMockStoreGetState(overrides: Record<string, unknown> = {}) {
  return () =>
    ({
      settings: { showFiatOnTestnets: false },
      engine: {
        backgroundState: {
          NftController: { nfts: [] },
          TokenBalancesController: { tokenBalances: {} },
        },
      },
      ...overrides,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
}

describe('fiat-balance utils', () => {
  describe('getTotalEvmFiatAccountBalance', () => {
    it('returns zeros when selected account is undefined', () => {
      const context = buildMockContext({
        AccountsController: {
          state: {
            internalAccounts: {
              accounts: {},
              selectedAccount: 'nonexistent',
            },
          },
          getAccount: () => undefined,
        },
      });

      const result = getTotalEvmFiatAccountBalance(
        context,
        buildMockStoreGetState(),
      );

      expect(result).toStrictEqual({
        ethFiat: 0,
        tokenFiat: 0,
        ethFiat1dAgo: 0,
        tokenFiat1dAgo: 0,
        totalNativeTokenBalance: '0',
        ticker: '',
      });
    });

    it('returns zeros on testnets when showFiatOnTestnets is false', () => {
      const testnetNetworkState = mockNetworkState({
        chainId: '0xaa36a7',
        id: '0xaa36a7',
        nickname: 'sepolia',
        ticker: 'SepoliaETH',
      });

      const context = buildMockContext({
        NetworkController: {
          state: testnetNetworkState,
          getNetworkClientById: () => ({
            configuration: {
              chainId: '0xaa36a7',
              ticker: 'SepoliaETH',
            },
          }),
        },
      });

      const result = getTotalEvmFiatAccountBalance(
        context,
        buildMockStoreGetState(),
      );

      expect(result).toStrictEqual({
        ethFiat: 0,
        tokenFiat: 0,
        ethFiat1dAgo: 0,
        tokenFiat1dAgo: 0,
        totalNativeTokenBalance: '0',
        ticker: '',
      });
    });

    it('calculates ETH-only balance correctly', () => {
      const ethPricePercentChange1d = 5;

      const context = buildMockContext({
        TokenRatesController: {
          state: {
            marketData: {
              [chainId]: {
                [zeroAddress()]: {
                  pricePercentChange1d: ethPricePercentChange1d,
                } as Partial<MarketDataDetails> as MarketDataDetails,
              },
            },
          },
        },
      });

      const result = getTotalEvmFiatAccountBalance(
        context,
        buildMockStoreGetState(),
      );

      const ethFiat = ethBalance * ethConversionRate;
      expect(result).toStrictEqual({
        ethFiat,
        ethFiat1dAgo: ethFiat / (1 + ethPricePercentChange1d / 100),
        tokenFiat: 0,
        tokenFiat1dAgo: 0,
        ticker: 'ETH',
        totalNativeTokenBalance: '1',
      });
    });

    it('calculates ETH + token balances correctly', () => {
      const ethPricePercentChange1d = 5;
      const token1Address = '0x0001' as Hex;
      const token2Address = '0x0002' as Hex;

      const tokens = [
        {
          address: token1Address,
          balance: 1,
          price: 1,
          pricePercentChange1d: -1,
          decimals: 18,
          symbol: 'TEST1',
        },
        {
          address: token2Address,
          balance: 2,
          price: 2,
          pricePercentChange1d: 2,
          decimals: 18,
          symbol: 'TEST2',
        },
      ];

      const context = buildMockContext({
        TokensController: {
          state: {
            allTokens: {
              [chainId]: {
                [selectedAddress]: tokens.map(
                  ({ address, balance, decimals, symbol }) => ({
                    address,
                    balance,
                    decimals,
                    symbol,
                  }),
                ),
              },
            },
          },
        },
        TokenBalancesController: {
          state: {
            tokenBalances: {
              [selectedAddress as Hex]: {
                [chainId]: {
                  [token1Address]: '0x0de0b6b3a7640000',
                  [token2Address]: '0x1bc16d674ec80000',
                },
              },
            },
          },
        },
        TokenRatesController: {
          state: {
            marketData: {
              [chainId]: {
                [zeroAddress()]: {
                  pricePercentChange1d: ethPricePercentChange1d,
                } as unknown as MarketDataDetails,
                [token1Address]: {
                  price: tokens[0].price,
                  pricePercentChange1d: tokens[0].pricePercentChange1d,
                } as unknown as MarketDataDetails,
                [token2Address]: {
                  price: tokens[1].price,
                  pricePercentChange1d: tokens[1].pricePercentChange1d,
                } as unknown as MarketDataDetails,
              },
            },
          },
        },
      });

      const result = getTotalEvmFiatAccountBalance(
        context,
        buildMockStoreGetState(),
      );

      const ethFiat = ethBalance * ethConversionRate;
      const [tokenFiat, tokenFiat1dAgo] = tokens.reduce(
        ([fiat, fiat1d], token) => {
          const value =
            Number(token.price) * token.balance * ethConversionRate;
          return [
            fiat + value,
            fiat1d + value / (1 + token.pricePercentChange1d / 100),
          ];
        },
        [0, 0],
      );

      expect(result).toStrictEqual({
        ethFiat,
        ethFiat1dAgo: ethFiat / (1 + ethPricePercentChange1d / 100),
        tokenFiat,
        tokenFiat1dAgo,
        ticker: 'ETH',
        totalNativeTokenBalance: '1',
      });
    });

    it('calculates ETH + staked ETH + tokens correctly', () => {
      const ethPricePercentChange1d = 5;
      const token1Address = '0x0001' as Hex;

      const context = buildMockContext({
        AccountTrackerController: {
          state: {
            accountsByChainId: {
              [chainId]: {
                [selectedAddress]: {
                  balance: (ethBalance * 1e18).toString(),
                  stakedBalance: (stakedEthBalance * 1e18).toString(),
                },
              },
            },
          },
        },
        TokensController: {
          state: {
            allTokens: {
              [chainId]: {
                [selectedAddress]: [
                  {
                    address: token1Address,
                    balance: 1,
                    decimals: 18,
                    symbol: 'TEST1',
                  },
                ],
              },
            },
          },
        },
        TokenBalancesController: {
          state: {
            tokenBalances: {
              [selectedAddress as Hex]: {
                [chainId]: {
                  [token1Address]: '0x0de0b6b3a7640000',
                },
              },
            },
          },
        },
        TokenRatesController: {
          state: {
            marketData: {
              [chainId]: {
                [zeroAddress()]: {
                  pricePercentChange1d: ethPricePercentChange1d,
                } as unknown as MarketDataDetails,
                [token1Address]: {
                  price: 1,
                  pricePercentChange1d: 0,
                } as unknown as MarketDataDetails,
              },
            },
          },
        },
      });

      const result = getTotalEvmFiatAccountBalance(
        context,
        buildMockStoreGetState(),
      );

      const ethFiat = (ethBalance + stakedEthBalance) * ethConversionRate;
      expect(result.ethFiat).toBe(ethFiat);
      expect(result.ticker).toBe('ETH');
    });

    it('accepts an explicit account parameter', () => {
      const context = buildMockContext({
        TokenRatesController: {
          state: {
            marketData: {
              [chainId]: {
                [zeroAddress()]: {
                  pricePercentChange1d: 0,
                } as Partial<MarketDataDetails> as MarketDataDetails,
              },
            },
          },
        },
      });

      const result = getTotalEvmFiatAccountBalance(
        context,
        buildMockStoreGetState(),
        mockAccount,
      );

      expect(result.ticker).toBe('ETH');
      expect(result.ethFiat).toBeGreaterThanOrEqual(0);
    });
  });

  describe('hasFunds', () => {
    it('returns false when no balances or NFTs exist', () => {
      const context = buildMockContext({
        AccountTrackerController: {
          state: { accountsByChainId: {} },
        },
      });

      const storeGetState = buildMockStoreGetState();
      const result = hasFunds(context, storeGetState);
      expect(result).toBe(false);
    });

    it('returns true when token balances are non-zero', () => {
      const context = buildMockContext({
        AccountTrackerController: {
          state: { accountsByChainId: {} },
        },
      });

      const storeGetState = buildMockStoreGetState({
        engine: {
          backgroundState: {
            NftController: { nfts: [] },
            TokenBalancesController: {
              tokenBalances: {
                '0xabc': {
                  '0x1': {
                    '0xtoken': '0x1',
                  },
                },
              },
            },
          },
        },
      });

      const result = hasFunds(context, storeGetState);
      expect(result).toBe(true);
    });

    it('returns true when NFTs exist', () => {
      const context = buildMockContext({
        AccountTrackerController: {
          state: { accountsByChainId: {} },
        },
      });

      const storeGetState = buildMockStoreGetState({
        engine: {
          backgroundState: {
            NftController: { nfts: [{ tokenId: '1' }] },
            TokenBalancesController: { tokenBalances: {} },
          },
        },
      });

      const result = hasFunds(context, storeGetState);
      expect(result).toBe(true);
    });

    it('returns undefined on error', () => {
      const context = buildMockContext();
      const storeGetState = () => {
        throw new Error('test error');
      };

      const result = hasFunds(
        context,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        storeGetState as any,
      );
      expect(result).toBeUndefined();
    });
  });
});
