import axios from 'axios';

export const SAFE_CHAINS_LIST_URL = 'https://chainid.network/chains.json';
export const SAFE_CHAINS_LIST_TTL_MS = 30 * 60 * 1000;
export const SAFE_CHAINS_LIST_TIMEOUT_MS = 15 * 1000;

export interface SafeChainsListEntry {
  chainId: number;
  name?: string;
  nativeCurrency?: { name?: string; symbol?: string; decimals?: number };
  rpc?: string[];
}

let cache: {
  promise: Promise<SafeChainsListEntry[]>;
  createdAt: number;
} | null = null;

/**
 * Fetches the chainid.network chain list once and shares the in-flight or
 * resolved promise between all callers for SAFE_CHAINS_LIST_TTL_MS.
 * Failed requests are not cached.
 *
 * @returns The list of chains published by chainid.network.
 */
export const getSafeChainsList = (): Promise<SafeChainsListEntry[]> => {
  const now = Date.now();
  if (cache && now - cache.createdAt < SAFE_CHAINS_LIST_TTL_MS) {
    return cache.promise;
  }

  const promise = (async () => {
    const { data } = await axios.get(SAFE_CHAINS_LIST_URL, {
      timeout: SAFE_CHAINS_LIST_TIMEOUT_MS,
    });
    if (!Array.isArray(data)) {
      throw new Error('Invalid safe chains list response');
    }
    return data as SafeChainsListEntry[];
  })();

  const entry = { promise, createdAt: now };
  cache = entry;
  promise.catch(() => {
    if (cache === entry) {
      cache = null;
    }
  });

  return promise;
};

export const resetSafeChainsListCache = () => {
  cache = null;
};
