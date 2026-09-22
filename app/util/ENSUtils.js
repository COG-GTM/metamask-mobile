import Engine from '../core/Engine';
import ENS from 'ethjs-ens';
import { toLowerCaseEquals } from '../util/general';
import {
  ChainId,
  InfuraNetworkType,
  NetworkType,
} from '@metamask/controller-utils';
const ENS_NAME_NOT_DEFINED_ERROR = 'ENS name not defined';
const INVALID_ENS_NAME_ERROR = 'invalid ENS name';
// One hour cache threshold.
const CACHE_REFRESH_THRESHOLD = 60 * 60 * 1000;
import { EMPTY_ADDRESS } from '../constants/transaction';
import { regex } from '../../app/util/regex';

/**
 * Utility class with the single responsibility
 * of caching ENS names
 *
 * TODO: Replace this entire module and cache with the core ENS controller
 */
export class ENSCache {
  static cache = {};
}

/**
 * A list of all chain IDs supported by the current legacy ENS library we are
 * using.
 *
 * Ropsten is excluded because we no longer support Ropsten.
 */
const ENS_SUPPORTED_CHAIN_IDS = [ChainId[NetworkType.mainnet]];

/**
 * We still need it to support the legacy ENS library that we are using.
 */
const ENS_SUPPORTED_NETWORK_IDS = {
  [InfuraNetworkType.mainnet]: '1',
};

/**
 * A map of chain ID to network ID for networks supported by the current
 * legacy ENS library we are using.
 */
const CHAIN_ID_TO_NETWORK_ID = {
  [ChainId[NetworkType.mainnet]]:
    ENS_SUPPORTED_NETWORK_IDS[NetworkType.mainnet],
};

/**
 * Build the key used to read and write ENS cache entries.
 *
 * @param {string} address - The address the ENS name belongs to.
 * @param {string} chainId - The chain ID the ENS name was resolved on.
 * @returns {string|undefined} The cache key, or undefined if the chain is not
 * supported by the legacy ENS library.
 */
export function getEnsCacheKey(address, chainId) {
  const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
  if (networkId === undefined) {
    return undefined;
  }

  return `${networkId}${address}`;
}

/**
 * Get a cached ENS name.
 *
 * @param {string} address - The address to lookup.
 * @param {string} chainId - The chain ID for the cached ENS name.
 * @returns {string|undefined} The cached ENS name, or undefined if the name
 * was not found in the cache.
 */
export function getCachedENSName(address, chainId) {
  const cacheKey = getEnsCacheKey(address, chainId);
  if (!cacheKey) {
    return undefined;
  }

  return ENSCache.cache[cacheKey]?.name;
}

export async function doENSReverseLookup(address, chainId) {
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();
  const cacheKey = getEnsCacheKey(address, chainId);
  const { name: cachedName, timestamp } =
    (cacheKey && ENSCache.cache[cacheKey]) || {};
  const nowTimestamp = Date.now();
  if (timestamp && nowTimestamp - timestamp < CACHE_REFRESH_THRESHOLD) {
    return Promise.resolve(cachedName);
  }

  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(chainId);

  if (networkHasEnsSupport) {
    const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
    this.ens = new ENS({ provider, network: networkId });
    try {
      const name = await this.ens.reverse(address);
      const resolvedAddress = await this.ens.lookup(name);
      if (toLowerCaseEquals(address, resolvedAddress)) {
        ENSCache.cache[cacheKey] = { name, timestamp: Date.now() };
        return name;
      }
    } catch (e) {
      if (
        e.message.includes(ENS_NAME_NOT_DEFINED_ERROR) ||
        e.message.includes(INVALID_ENS_NAME_ERROR)
      ) {
        ENSCache.cache[cacheKey] = { timestamp: Date.now() };
      }
    }
  }
}

export async function doENSLookup(ensName, chainId) {
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();

  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(chainId);

  if (networkHasEnsSupport) {
    const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
    this.ens = new ENS({ provider, network: networkId });
    try {
      const resolvedAddress = await this.ens.lookup(ensName);
      if (resolvedAddress === EMPTY_ADDRESS) return;
      return resolvedAddress;
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

export function isDefaultAccountName(name) {
  return regex.defaultAccount.test(name);
}
