import { TokenI } from '../types';

/**
 * Builds the lookup key used to identify an earn token by symbol and chain.
 *
 * @param symbol - Token symbol (e.g. `USDC`).
 * @param chainId - Chain ID the token lives on.
 * @returns A `symbol-chainId` string key.
 */
export const getEarnTokenKey = (
  symbol: string | undefined,
  chainId: string | undefined,
) => `${symbol}-${chainId}`;

/**
 * Builds an O(1) membership lookup of supported earn tokens keyed by
 * symbol + chainId, so each token row can check support without
 * recomputing the account-wide earn token list.
 *
 * @param earnTokens - Supported earn tokens for the account.
 * @returns A read-only set of `getEarnTokenKey` keys.
 */
export const buildEarnTokenKeys = (
  earnTokens: Pick<TokenI, 'symbol' | 'chainId'>[],
): ReadonlySet<string> =>
  new Set(
    earnTokens.map((token) => getEarnTokenKey(token.symbol, token.chainId)),
  );
