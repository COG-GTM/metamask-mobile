import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { selectCurrentCurrency } from '../../../selectors/currencyRateController';
import {
  selectEvmTokenFiatBalances,
  selectEvmTokens,
} from '../../../selectors/multichain';
import { isTestNet } from '../../../util/networks';
import { useAsyncResult } from '../useAsyncResult';
import {
  fetchEvmHistoricalPrices,
  TimePeriod,
  TokenPrice,
} from '../useTokenHistoricalPrices';
import { buildPortfolioSeries } from './utils';

/**
 * Number of holdings, largest first, included in the portfolio series. Bounds
 * the number of price API requests for accounts holding many small positions.
 */
export const MAX_TRACKED_TOKENS = 8;

interface TrackedToken {
  address: string;
  chainId: Hex;
  tokenFiatAmount: number;
}

interface UsePortfolioBalanceHistoryResult {
  data: TokenPrice[];
  isLoading: boolean;
  error: Error | undefined;
}

/**
 * Historical fiat value of the selected account's EVM holdings, aggregated
 * across chains.
 */
export const usePortfolioBalanceHistory = ({
  timePeriod,
}: {
  timePeriod: TimePeriod;
}): UsePortfolioBalanceHistoryResult => {
  const currentCurrency = useSelector(selectCurrentCurrency);
  const tokens = useSelector(selectEvmTokens);
  const tokenFiatBalances = useSelector(selectEvmTokenFiatBalances);

  const trackedTokens = useMemo(() => {
    // Holdings of the same asset (e.g. native and staked native) share a price
    // series, so they are merged into a single position.
    const positions = new Map<string, TrackedToken>();

    tokens.forEach((token, index) => {
      const chainId = token.chainId as Hex;
      const tokenFiatAmount = tokenFiatBalances[index] ?? 0;

      if (!token.address || isTestNet(chainId) || tokenFiatAmount <= 0) {
        return;
      }

      const key = `${chainId}:${token.address.toLowerCase()}`;
      const position = positions.get(key);

      if (position) {
        position.tokenFiatAmount += tokenFiatAmount;
      } else {
        positions.set(key, {
          address: token.address,
          chainId,
          tokenFiatAmount,
        });
      }
    });

    return [...positions.values()]
      .sort((a, b) => b.tokenFiatAmount - a.tokenFiatAmount)
      .slice(0, MAX_TRACKED_TOKENS);
  }, [tokens, tokenFiatBalances]);

  const trackedTokensKey = useMemo(
    () =>
      trackedTokens
        .map(
          ({ address, chainId, tokenFiatAmount }) =>
            `${chainId}:${address}:${tokenFiatAmount}`,
        )
        .join(','),
    [trackedTokens],
  );

  const { value, pending, error } = useAsyncResult(async () => {
    if (trackedTokens.length === 0) {
      return [];
    }

    const results = await Promise.all(
      trackedTokens.map(async ({ address, chainId, tokenFiatAmount }) => {
        try {
          const prices = await fetchEvmHistoricalPrices({
            address,
            chainId,
            timePeriod,
            vsCurrency: currentCurrency,
          });
          return { prices: prices ?? [], tokenFiatAmount };
        } catch {
          return { prices: [], tokenFiatAmount };
        }
      }),
    );

    return buildPortfolioSeries(results);
  }, [trackedTokensKey, timePeriod, currentCurrency]);

  return { data: value ?? [], isLoading: pending, error };
};

export default usePortfolioBalanceHistory;
