import axios from 'axios';

export const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';
const CHAIN_ID_NETWORK_TIMEOUT = 10000;

export interface SafeChain {
  chainId: number;
  name?: string;
  nativeCurrency?: { symbol?: string };
  rpc?: string[];
}

export interface SafeChainsListRequest {
  promise: Promise<SafeChain[]>;
  release: () => void;
}

interface CacheEntry {
  promise: Promise<SafeChain[]>;
  abortController: AbortController | null;
  subscribers: number;
}

let cache: CacheEntry | null = null;

export const resetSafeChainsListCache = () => {
  cache = null;
};

/**
 * Fetches the safe chains list at most once per app session and shares the
 * parsed result across callers.
 *
 * @returns The shared request and a cleanup function the caller must invoke
 * when it no longer needs the result. The in-flight request is aborted once
 * every caller has released it.
 */
export const getSafeChainsList = (): SafeChainsListRequest => {
  if (!cache) {
    const abortController = new AbortController();
    const entry: CacheEntry = {
      abortController,
      subscribers: 0,
      promise: axios
        .get<SafeChain[]>(CHAIN_ID_NETWORK_URL, {
          timeout: CHAIN_ID_NETWORK_TIMEOUT,
          signal: abortController.signal,
        })
        .then(({ data }) => {
          if (cache === entry) {
            entry.abortController = null;
          }
          return data;
        })
        .catch((error) => {
          if (cache === entry) {
            cache = null;
          }
          throw error;
        }),
    };
    cache = entry;
  }

  const entry = cache;
  entry.subscribers += 1;
  let released = false;

  return {
    promise: entry.promise,
    release: () => {
      if (released) {
        return;
      }
      released = true;
      entry.subscribers -= 1;
      if (entry.subscribers === 0 && entry.abortController) {
        entry.abortController.abort();
        if (cache === entry) {
          cache = null;
        }
      }
    },
  };
};
