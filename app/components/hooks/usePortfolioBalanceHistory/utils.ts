import { TokenPrice } from '../useTokenHistoricalPrices';

export interface PortfolioHistoryInput {
  /** Historical prices for the token, ascending by timestamp */
  prices: TokenPrice[];
  /** Current fiat value of the account's holding of this token */
  tokenFiatAmount: number;
}

/**
 * Scales a token's price series into a fiat value series for the amount held.
 *
 * The held amount is derived from the current fiat value rather than the raw
 * balance, so the series is anchored to the balance already displayed to the
 * user: value(t) = tokenFiatAmount * price(t) / price(latest).
 */
const toFiatSeries = ({
  prices,
  tokenFiatAmount,
}: PortfolioHistoryInput): [number, number][] | undefined => {
  const points = prices
    .map(([timestamp, price]) => [Number(timestamp), price] as [number, number])
    .filter(
      ([timestamp, price]) =>
        Number.isFinite(timestamp) && Number.isFinite(price) && price > 0,
    )
    .sort((a, b) => a[0] - b[0]);

  if (points.length < 2) {
    return undefined;
  }

  const latestPrice = points[points.length - 1][1];

  return points.map(([timestamp, price]) => [
    timestamp,
    (tokenFiatAmount * price) / latestPrice,
  ]);
};

/**
 * Combines per-token fiat series into a single portfolio series.
 *
 * Series returned by the price API share a time period but not necessarily
 * their sampling, so the densest series provides the timeline and every other
 * series contributes its most recent value at or before each timestamp.
 */
export const buildPortfolioSeries = (
  inputs: PortfolioHistoryInput[],
): TokenPrice[] => {
  const series = inputs
    .filter(({ tokenFiatAmount }) => tokenFiatAmount > 0)
    .map(toFiatSeries)
    .filter((entry): entry is [number, number][] => Boolean(entry));

  if (series.length === 0) {
    return [];
  }

  const timeline = series.reduce((longest, current) =>
    current.length > longest.length ? current : longest,
  );

  const cursors = new Array(series.length).fill(0);

  return timeline.map(([timestamp]) => {
    const total = series.reduce((sum, points, seriesIndex) => {
      let cursor = cursors[seriesIndex];
      while (cursor + 1 < points.length && points[cursor + 1][0] <= timestamp) {
        cursor += 1;
      }
      cursors[seriesIndex] = cursor;
      return sum + points[cursor][1];
    }, 0);

    return [timestamp.toString(), total] as TokenPrice;
  });
};

/**
 * Difference between the first and last value of a series.
 */
export const getSeriesDiff = (series: TokenPrice[]): number => {
  if (series.length < 2) {
    return 0;
  }
  return series[series.length - 1][1] - series[0][1];
};
