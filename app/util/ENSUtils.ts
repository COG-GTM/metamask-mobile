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
interface ENSCacheEntry {
  name?: string;
  timestamp?: number;
}

export class ENSCache {
  static cache: Record<string, ENSCacheEntry> = {};
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
const CHAIN_ID_TO_NETWORK_ID: Record<string, string> = {
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
export function getCachedENSName(address: string, chainId: string) {
  const networkHasEnsSupport = (ENS_SUPPORTED_CHAIN_IDS as string[]).includes(
    chainId,
  );
  if (!networkHasEnsSupport) {
    return undefined;
  }

  const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
  const cacheEntry = ENSCache.cache[networkId + address];

  return cacheEntry?.name;
}

export async function doENSReverseLookup(
  // The functions below assign to `this.ens`, which is `undefined` for the
  // plain calls every caller makes; typing it preserves that as-is.
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: any,
  address: string,
  chainId?: string,
) {
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();
  const { name: cachedName, timestamp } =
    ENSCache.cache[chainId + address] || {};
  const nowTimestamp = Date.now();
  if (timestamp && nowTimestamp - timestamp < CACHE_REFRESH_THRESHOLD) {
    return Promise.resolve(cachedName);
  }

  const networkHasEnsSupport = (ENS_SUPPORTED_CHAIN_IDS as string[]).includes(
    chainId as string,
  );

  if (networkHasEnsSupport) {
    const networkId = CHAIN_ID_TO_NETWORK_ID[chainId as string];
    this.ens = new ENS({ provider, network: networkId });
    try {
      const name = await this.ens.reverse(address);
      const resolvedAddress = await this.ens.lookup(name);
      if (toLowerCaseEquals(address, resolvedAddress)) {
        ENSCache.cache[networkId + address] = { name, timestamp: Date.now() };
        return name;
      }
    } catch (e) {
      if (
        (e as Error).message.includes(ENS_NAME_NOT_DEFINED_ERROR) ||
        (e as Error).message.includes(INVALID_ENS_NAME_ERROR)
      ) {
        ENSCache.cache[networkId + address] = { timestamp: Date.now() };
      }
    }
  }
}

export async function doENSLookup(
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: any,
  ensName: string,
  chainId?: string,
) {
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();

  const networkHasEnsSupport = (ENS_SUPPORTED_CHAIN_IDS as string[]).includes(
    chainId as string,
  );

  if (networkHasEnsSupport) {
    const networkId = CHAIN_ID_TO_NETWORK_ID[chainId as string];
    this.ens = new ENS({ provider, network: networkId });
    try {
      const resolvedAddress: string = await this.ens.lookup(ensName);
      if (resolvedAddress === EMPTY_ADDRESS) return;
      return resolvedAddress;
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

export function isDefaultAccountName(name?: string) {
  return regex.defaultAccount.test(name as string);
}
