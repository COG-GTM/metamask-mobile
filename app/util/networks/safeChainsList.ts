import axios from 'axios';

export const SAFE_CHAINS_LIST_URL = 'https://chainid.network/chains.json';
export const SAFE_CHAINS_LIST_TTL_MS = 60 * 60 * 1000;

export interface SafeChainListEntry {
  chainId: number;
  name: string;
  nativeCurrency: { name?: string; symbol: string; decimals?: number };
  rpc: string[];
}

let cachedRequest:
  | { promise: Promise<SafeChainListEntry[]>; fetchedAt: number }
  | undefined;

/**
 * Returns the chainid.network registry, downloading it at most once per TTL.
 * Concurrent callers share the same in-flight request; failures are not cached.
 * The returned array is shared between consumers and must not be mutated.
 */
export const getSafeChainsList = (): Promise<SafeChainListEntry[]> => {
  const now = Date.now();
  if (
    cachedRequest &&
    now - cachedRequest.fetchedAt < SAFE_CHAINS_LIST_TTL_MS
  ) {
    return cachedRequest.promise;
  }

  const request = {
    fetchedAt: now,
    promise: axios
      .get<SafeChainListEntry[]>(SAFE_CHAINS_LIST_URL)
      .then(({ data }) => data),
  };
  request.promise.catch(() => {
    if (cachedRequest === request) {
      cachedRequest = undefined;
    }
  });
  cachedRequest = request;
  return request.promise;
};

/**
 * Drops the cached (or in-flight) chains.json request so the next
 * `getSafeChainsList` call downloads it again. Intended for test isolation.
 */
export const clearSafeChainsListCache = () => {
  cachedRequest = undefined;
};
