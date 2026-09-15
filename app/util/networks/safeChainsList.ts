import axios from 'axios';

export const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';
export const SAFE_CHAINS_LIST_TTL_MS = 24 * 60 * 60 * 1000;

export interface SafeChain {
  chainId: string | number;
  name: string;
  nativeCurrency: { symbol: string; decimals?: number };
  rpc: string[];
}

let cachedList: SafeChain[] | null = null;
let cachedAt = 0;
let cachedByChainId: Map<string, SafeChain> | null = null;
let mapForList: SafeChain[] | null = null;
let inFlight: Promise<SafeChain[]> | null = null;

/**
 * Fetches the community chain list once and shares the parsed result
 * across all callers for SAFE_CHAINS_LIST_TTL_MS. Concurrent callers share
 * the in-flight request. Failures are not cached.
 */
export async function getSafeChainsList(): Promise<SafeChain[]> {
  if (cachedList && Date.now() - cachedAt < SAFE_CHAINS_LIST_TTL_MS) {
    return cachedList;
  }
  if (inFlight) {
    return inFlight;
  }
  inFlight = axios
    .get<SafeChain[]>(CHAIN_ID_NETWORK_URL)
    .then(({ data }) => {
      cachedList = data;
      cachedAt = Date.now();
      cachedByChainId = null;
      mapForList = null;
      return data;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** O(1) lookup by decimal chain id (string or number), built once per cached list. */
export async function getSafeChainByChainId(
  chainIdDecimal: string | number,
): Promise<SafeChain | undefined> {
  const list = await getSafeChainsList();
  if (!cachedByChainId || mapForList !== list) {
    cachedByChainId = new Map(
      list.map((chain) => [String(chain.chainId), chain]),
    );
    mapForList = list;
  }
  return cachedByChainId.get(String(chainIdDecimal));
}

/** Test-only helper. */
export function resetSafeChainsListCache(): void {
  cachedList = null;
  cachedAt = 0;
  cachedByChainId = null;
  mapForList = null;
  inFlight = null;
}
