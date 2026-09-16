import { TokenI } from '../types';

export const getEarnTokenKey = (
  symbol: string | undefined,
  chainId: string | undefined,
) => `${symbol}-${chainId}`;

// Builds an O(1) lookup of supported earn tokens keyed by symbol + chainId,
// so each token row can check membership without rebuilding the list.
export const buildEarnTokenKeys = (
  earnTokens: Pick<TokenI, 'symbol' | 'chainId'>[],
): ReadonlySet<string> =>
  new Set(
    earnTokens.map((token) => getEarnTokenKey(token.symbol, token.chainId)),
  );
