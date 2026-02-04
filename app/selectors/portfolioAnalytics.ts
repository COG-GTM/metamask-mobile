import { createSelector } from 'reselect';
import { Hex } from '@metamask/utils';
import { RootState } from '../reducers';
import { createDeepEqualSelector } from './util';
import {
  selectEvmTokens,
  selectEvmTokenFiatBalances,
} from './multichain/evm';
import { selectTokenMarketData } from './tokenRatesController';
import { selectEvmNetworkConfigurationsByChainId } from './networkController';
import { selectSelectedInternalAccountAddress } from './accountsController';
import { selectTokensBalances } from './tokenBalancesController';
import {
  TokenHolding,
  TokenWithMarketData,
  calculateTotalPortfolioValue,
  calculateAllTokenAllocations,
  calculateNetworkAllocation,
  calculateFullAllocation,
  calculateTotalProfitLoss,
  calculatePortfolioUnrealizedPL,
  calculateAllPortfolioROI,
} from '../util/portfolioAnalytics';
import { TokenI } from '../components/UI/Tokens/types';

const mapTokenToHolding = (
  token: TokenI,
  balanceFiat: number,
): TokenHolding => ({
  address: token.address,
  chainId: (token.chainId ?? '0x1') as Hex,
  symbol: token.symbol,
  name: token.name,
  decimals: token.decimals,
  balance: token.balance,
  balanceFiat,
  isNative: token.isNative ?? false,
});

export const selectPortfolioTokenHoldings = createDeepEqualSelector(
  [selectEvmTokens, selectEvmTokenFiatBalances],
  (tokens, fiatBalances): TokenHolding[] =>
    tokens.map((token, index) =>
      mapTokenToHolding(token, fiatBalances[index] ?? 0),
    ),
);

export const selectTotalPortfolioValue = createSelector(
  [selectPortfolioTokenHoldings],
  (holdings): number => calculateTotalPortfolioValue(holdings),
);

export const selectTokenAllocations = createDeepEqualSelector(
  [selectPortfolioTokenHoldings],
  (holdings) => calculateAllTokenAllocations(holdings),
);

export const selectNetworkAllocations = createDeepEqualSelector(
  [selectPortfolioTokenHoldings, selectEvmNetworkConfigurationsByChainId],
  (holdings, networkConfigs) => {
    const networkConfigsWithName: Record<Hex, { name: string }> = {};
    for (const [chainId, config] of Object.entries(networkConfigs)) {
      networkConfigsWithName[chainId as Hex] = {
        name: config.name ?? `Chain ${chainId}`,
      };
    }
    return calculateNetworkAllocation(holdings, networkConfigsWithName);
  },
);

export const selectFullAllocation = createDeepEqualSelector(
  [selectPortfolioTokenHoldings, selectEvmNetworkConfigurationsByChainId],
  (holdings, networkConfigs) => {
    const networkConfigsWithName: Record<Hex, { name: string }> = {};
    for (const [chainId, config] of Object.entries(networkConfigs)) {
      networkConfigsWithName[chainId as Hex] = {
        name: config.name ?? `Chain ${chainId}`,
      };
    }
    return calculateFullAllocation(holdings, networkConfigsWithName);
  },
);

export const selectPortfolioProfitLoss = createDeepEqualSelector(
  [selectPortfolioTokenHoldings],
  (holdings) => calculateTotalProfitLoss(holdings),
);

export const selectTokenProfitLossList = createDeepEqualSelector(
  [selectPortfolioTokenHoldings],
  (holdings) => calculatePortfolioUnrealizedPL(holdings),
);

export const selectTokensWithMarketData = createDeepEqualSelector(
  [selectPortfolioTokenHoldings, selectTokenMarketData],
  (holdings, marketData): TokenWithMarketData[] =>
    holdings.map((holding) => {
      const chainMarketData = marketData?.[holding.chainId];
      const tokenMarketData = chainMarketData?.[holding.address as Hex];

      return {
        ...holding,
        marketData: tokenMarketData
          ? {
              price: tokenMarketData.price,
              pricePercentChange1d: tokenMarketData.pricePercentChange1d,
              pricePercentChange7d: tokenMarketData.pricePercentChange7d,
              pricePercentChange30d: tokenMarketData.pricePercentChange30d,
              pricePercentChange1y: tokenMarketData.pricePercentChange1y,
            }
          : undefined,
      };
    }),
);

export const selectPortfolioROI = createDeepEqualSelector(
  [selectTokensWithMarketData],
  (tokensWithMarketData) => calculateAllPortfolioROI(tokensWithMarketData),
);

export const selectPortfolioROI24h = createSelector(
  [selectPortfolioROI],
  (portfolioROI) => portfolioROI.roi24h,
);

export const selectPortfolioROI7d = createSelector(
  [selectPortfolioROI],
  (portfolioROI) => portfolioROI.roi7d,
);

export const selectPortfolioROI30d = createSelector(
  [selectPortfolioROI],
  (portfolioROI) => portfolioROI.roi30d,
);

export const selectPortfolioROI1y = createSelector(
  [selectPortfolioROI],
  (portfolioROI) => portfolioROI.roi1y,
);

export const selectPortfolioAnalyticsSummary = createDeepEqualSelector(
  [
    selectTotalPortfolioValue,
    selectPortfolioProfitLoss,
    selectPortfolioROI,
    selectTokenAllocations,
    selectNetworkAllocations,
  ],
  (totalValue, profitLoss, roi, tokenAllocations, networkAllocations) => ({
    totalValue,
    profitLoss,
    roi,
    topTokenAllocations: tokenAllocations.slice(0, 5),
    topNetworkAllocations: networkAllocations.slice(0, 5),
  }),
);
