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
  timestamp: number;
}

/**
 * The legacy ENS library instance is stored on the `this` context of the
 * lookup helpers below. Callers invoke them as plain functions, so `this` may
 * be `void`.
 */
interface ENSLookupContext {
  ens?: ENS;
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
const ENS_SUPPORTED_CHAIN_IDS: string[] = [ChainId[NetworkType.mainnet]];

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
 * @param address - The address to lookup.
 * @param chainId - The chain ID for the cached ENS name.
 * @returns The cached ENS name, or undefined if the name
 * was not found in the cache.
 */
export function getCachedENSName(
  address: string,
  chainId: string,
): string | undefined {
  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(chainId);
  if (!networkHasEnsSupport) {
    return undefined;
  }

  const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
  const cacheEntry = ENSCache.cache[networkId + address];

  return cacheEntry?.name;
}

export async function doENSReverseLookup(
  this: ENSLookupContext | void,
  address: string | undefined,
  chainId?: string,
): Promise<string | undefined> {
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();
  const { name: cachedName, timestamp } =
    ENSCache.cache[`${chainId}${address}`] || {};
  const self = this as ENSLookupContext;
  const nowTimestamp = Date.now();
  if (timestamp && nowTimestamp - timestamp < CACHE_REFRESH_THRESHOLD) {
    return Promise.resolve(cachedName);
  }

  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(
    chainId as string,
  );

  if (networkHasEnsSupport) {
    const networkId = CHAIN_ID_TO_NETWORK_ID[chainId as string];
    self.ens = new ENS({ provider, network: networkId });
    try {
      const name = await self.ens.reverse(address as string);
      const resolvedAddress = await self.ens.lookup(name);
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
  this: ENSLookupContext | void,
  ensName: string,
  chainId?: string,
): Promise<string | undefined> {
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();
  const self = this as ENSLookupContext;

  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(
    chainId as string,
  );

  if (networkHasEnsSupport) {
    const networkId = CHAIN_ID_TO_NETWORK_ID[chainId as string];
    self.ens = new ENS({ provider, network: networkId });
    try {
      const resolvedAddress = await self.ens.lookup(ensName);
      if (resolvedAddress === EMPTY_ADDRESS) return;
      return resolvedAddress;
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

export function isDefaultAccountName(name?: string) {
  return regex.defaultAccount.test(name as string);
}
