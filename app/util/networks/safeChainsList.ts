import axios from 'axios';

export const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

export const SAFE_CHAINS_LIST_TTL_MS = 30 * 60 * 1000;
export const SAFE_CHAINS_LIST_TIMEOUT_MS = 10 * 1000;

export interface SafeChainsListEntry {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc: string[];
}

let cachedList: {
  fetchedAt: number;
  request: Promise<unknown[]>;
} | null = null;

/**
 * Fetches the chainid.network chain list, reusing an in-flight or recently
 * resolved request so repeated callers do not re-download the multi-megabyte
 * payload. Failed requests are not cached.
 */
export const getSafeChainsList = <T = SafeChainsListEntry>(): Promise<T[]> => {
  if (
    cachedList &&
    Date.now() - cachedList.fetchedAt < SAFE_CHAINS_LIST_TTL_MS
  ) {
    return cachedList.request as Promise<T[]>;
  }

  const request = axios
    .get<T[]>(CHAIN_ID_NETWORK_URL, {
      timeout: SAFE_CHAINS_LIST_TIMEOUT_MS,
    })
    .then(({ data }) => data)
    .catch((error) => {
      cachedList = null;
      throw error;
    });

  cachedList = { fetchedAt: Date.now(), request };

  return request;
};

export const clearSafeChainsListCache = () => {
  cachedList = null;
};
