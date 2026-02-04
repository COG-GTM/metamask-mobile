import { Hex } from '@metamask/utils';
import { RootState } from '../reducers';
import {
  selectPortfolioTokenHoldings,
  selectTotalPortfolioValue,
  selectTokenAllocations,
  selectNetworkAllocations,
  selectPortfolioProfitLoss,
  selectPortfolioROI,
  selectPortfolioAnalyticsSummary,
} from './portfolioAnalytics';

const createMockState = (): RootState =>
  ({
    engine: {
      backgroundState: {
        AccountsController: {
          internalAccounts: {
            selectedAccount: 'account-1',
            accounts: {
              'account-1': {
                address: '0x1234567890abcdef1234567890abcdef12345678',
                id: 'account-1',
                metadata: { name: 'Account 1', keyring: { type: 'HD Key Tree' } },
                options: {},
                methods: [],
                type: 'eip155:eoa',
              },
            },
          },
        },
        TokensController: {
          allTokens: {},
          tokens: [],
          ignoredTokens: [],
          detectedTokens: [],
          allIgnoredTokens: {},
          allDetectedTokens: {},
        },
        TokenBalancesController: {
          tokenBalances: {},
        },
        TokenRatesController: {
          marketData: {
            '0x1': {
              '0xtoken1': {
                price: 10,
                pricePercentChange1d: 5,
                pricePercentChange7d: 10,
                pricePercentChange30d: 20,
                pricePercentChange1y: 50,
              },
            },
          },
        },
        CurrencyRateController: {
          currentCurrency: 'usd',
          currencyRates: {
            ETH: { conversionRate: 2000 },
          },
        },
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Ethereum Mainnet',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  networkClientId: 'mainnet',
                  type: 'infura',
                  url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
                },
              ],
              defaultRpcEndpointIndex: 0,
            },
          },
          networksMetadata: {
            mainnet: { status: 'available', EIPS: { 1559: true } },
          },
        },
        AccountTrackerController: {
          accounts: {},
          accountsByChainId: {
            '0x1': {
              '0x1234567890abcdef1234567890abcdef12345678': {
                balance: '0x0',
              },
            },
          },
        },
        PreferencesController: {
          tokenNetworkFilter: { '0x1': true },
        },
        MultichainNetworkController: {
          isEvmSelected: true,
          selectedMultichainNetworkChainId: '0x1',
          multichainNetworkConfigurationsByChainId: {},
        },
      },
    },
    settings: {
      hideZeroBalanceTokens: false,
      showFiatOnTestnets: false,
    },
    user: {
      appTheme: 'light',
    },
  } as unknown as RootState);

describe('portfolioAnalytics selectors', () => {
  describe('selectPortfolioTokenHoldings', () => {
    it('returns empty array when no tokens', () => {
      const state = createMockState();
      const result = selectPortfolioTokenHoldings(state);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('selectTotalPortfolioValue', () => {
    it('returns 0 when no tokens', () => {
      const state = createMockState();
      const result = selectTotalPortfolioValue(state);
      expect(result).toBe(0);
    });
  });

  describe('selectTokenAllocations', () => {
    it('returns array of token allocations', () => {
      const state = createMockState();
      const result = selectTokenAllocations(state);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('selectNetworkAllocations', () => {
    it('returns array of network allocations', () => {
      const state = createMockState();
      const result = selectNetworkAllocations(state);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('selectPortfolioProfitLoss', () => {
    it('returns zero P&L when no tokens', () => {
      const state = createMockState();
      const result = selectPortfolioProfitLoss(state);
      expect(result.unrealizedPL).toBe(0);
      expect(result.realizedPL).toBe(0);
      expect(result.totalPL).toBe(0);
    });
  });

  describe('selectPortfolioROI', () => {
    it('returns zero ROI for all periods when no tokens', () => {
      const state = createMockState();
      const result = selectPortfolioROI(state);
      expect(result.roi24h.percentageReturn).toBe(0);
      expect(result.roi7d.percentageReturn).toBe(0);
      expect(result.roi30d.percentageReturn).toBe(0);
      expect(result.roi1y.percentageReturn).toBe(0);
    });
  });

  describe('selectPortfolioAnalyticsSummary', () => {
    it('returns complete summary object', () => {
      const state = createMockState();
      const result = selectPortfolioAnalyticsSummary(state);

      expect(result).toHaveProperty('totalValue');
      expect(result).toHaveProperty('profitLoss');
      expect(result).toHaveProperty('roi');
      expect(result).toHaveProperty('topTokenAllocations');
      expect(result).toHaveProperty('topNetworkAllocations');
    });
  });
});
