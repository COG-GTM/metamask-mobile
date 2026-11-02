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
export const CACHE_REFRESH_THRESHOLD = 60 * 60 * 1000;
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
 * Get a cached ENS name.
 *
 * @param {string} address - The address to lookup.
 * @param {string} chainId - The chain ID for the cached ENS name.
 * @returns {string|undefined} The cached ENS name, or undefined if the name
 * was not found in the cache.
 */
export function getCachedENSName(address, chainId) {
  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(chainId);
  if (!networkHasEnsSupport) {
    return undefined;
  }

  const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
  const cacheEntry = ENSCache.cache[networkId + address];

  return cacheEntry?.name;
}

/**
 * Whether the latest unexpired cache entry confirms the address has no ENS name.
 *
 * @param {string} address - The address to check.
 * @param {string} chainId - The chain ID.
 * @returns {boolean} True when a lookup confirmed there is no verified name.
 */
export function isENSNameConfirmedAbsent(address, chainId) {
  if (!ENS_SUPPORTED_CHAIN_IDS.includes(chainId)) {
    return false;
  }
  const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
  const cacheEntry = ENSCache.cache[networkId + address];
  return Boolean(
    cacheEntry?.timestamp &&
      !cacheEntry.name &&
      Date.now() - cacheEntry.timestamp < CACHE_REFRESH_THRESHOLD,
  );
}

let ensInstance;
let ensInstanceProvider;
let ensInstanceNetworkId;

/**
 * Returns an ENS client for the given provider and network, reusing the
 * previous instance when neither has changed.
 *
 * @param {object} provider - The network provider.
 * @param {string} networkId - The legacy network ID.
 * @returns {ENS} The ENS client.
 */
function getENSInstance(provider, networkId) {
  if (
    !ensInstance ||
    ensInstanceProvider !== provider ||
    ensInstanceNetworkId !== networkId
  ) {
    ensInstance = new ENS({ provider, network: networkId });
    ensInstanceProvider = provider;
    ensInstanceNetworkId = networkId;
  }
  return ensInstance;
}

const pendingReverseLookups = new Map();

/**
 * Reverse-resolves an address and verifies the name resolves back to it.
 * Verified names are cached under `cacheKey`; "not defined" and "invalid
 * name" errors are cached as a nameless entry so they are not retried until
 * the entry expires. Other errors are not cached.
 *
 * @param {string} address - The address to reverse-resolve.
 * @param {string} networkId - The legacy network ID.
 * @param {string} cacheKey - The `ENSCache` key (`networkId + address`).
 * @returns {Promise<string|undefined>} The verified ENS name, if any.
 */
async function fetchENSReverseLookup(address, networkId, cacheKey) {
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();
  const ens = getENSInstance(provider, networkId);
  try {
    const name = await ens.reverse(address);
    const resolvedAddress = await ens.lookup(name);
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

export async function doENSReverseLookup(address, chainId) {
  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(chainId);
  if (!networkHasEnsSupport) {
    return undefined;
  }

  const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
  const cacheKey = networkId + address;
  const { name: cachedName, timestamp } = ENSCache.cache[cacheKey] || {};
  if (timestamp && Date.now() - timestamp < CACHE_REFRESH_THRESHOLD) {
    return cachedName;
  }

  const pendingLookup = pendingReverseLookups.get(cacheKey);
  if (pendingLookup) {
    return pendingLookup;
  }

  const lookup = fetchENSReverseLookup(address, networkId, cacheKey).finally(
    () => {
      pendingReverseLookups.delete(cacheKey);
    },
  );
  pendingReverseLookups.set(cacheKey, lookup);
  return lookup;
}

export async function doENSLookup(ensName, chainId) {
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();

  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(chainId);

  if (networkHasEnsSupport) {
    const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
    const ens = getENSInstance(provider, networkId);
    try {
      const resolvedAddress = await ens.lookup(ensName);
      if (resolvedAddress === EMPTY_ADDRESS) return;
      return resolvedAddress;
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

export function isDefaultAccountName(name) {
  return regex.defaultAccount.test(name);
}
