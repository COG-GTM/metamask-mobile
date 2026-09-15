/**
 * Builds the lookup key used to check whether a token row is a supported
 * earn token. The separator cannot appear in a chainId, so a key uniquely
 * identifies a (chainId, symbol) pair.
 */
export const getEarnTokenKey = (
  symbol: string | undefined,
  chainId: string | undefined,
): string => `${chainId}|${symbol}`;
