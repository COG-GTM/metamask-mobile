import Engine from '../core/Engine';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - ethjs-ens does not have type definitions
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
 * Represents an Ethereum address as a hex string
 */
type EthAddress = string;

/**
 * Represents an ENS domain name
 */
type ENSDomainName = string;

/**
 * Represents a chain ID as a hex string (e.g., '0x1' for mainnet)
 */
type HexChainId = string;

/**
 * Represents a network ID as a string (e.g., '1' for mainnet)
 */
type NetworkId = string;

/**
 * Cache entry for ENS name resolution
 */
interface ENSCacheEntry {
  name?: ENSDomainName;
  timestamp: number;
}

/**
 * Cache storage type mapping network ID + address to cache entry
 */
type ENSCacheStorage = Record<string, ENSCacheEntry>;

/**
 * ENS instance interface for the ethjs-ens library
 */
interface ENSInstance {
  reverse: (address: EthAddress) => Promise<ENSDomainName>;
  lookup: (name: ENSDomainName) => Promise<EthAddress>;
}

/**
 * Utility class with the single responsibility
 * of caching ENS names
 *
 * TODO: Replace this entire module and cache with the core ENS controller
 */
export class ENSCache {
  static cache: ENSCacheStorage = {};
}

/**
 * A list of all chain IDs supported by the current legacy ENS library we are
 * using.
 *
 * Ropsten is excluded because we no longer support Ropsten.
 */
const ENS_SUPPORTED_CHAIN_IDS: HexChainId[] = [ChainId[NetworkType.mainnet]];

/**
 * We still need it to support the legacy ENS library that we are using.
 */
const ENS_SUPPORTED_NETWORK_IDS: Record<string, NetworkId> = {
  [InfuraNetworkType.mainnet]: '1',
};

/**
 * A map of chain ID to network ID for networks supported by the current
 * legacy ENS library we are using.
 */
const CHAIN_ID_TO_NETWORK_ID: Record<HexChainId, NetworkId> = {
  [ChainId[NetworkType.mainnet]]:
    ENS_SUPPORTED_NETWORK_IDS[NetworkType.mainnet],
};

/**
 * Get a cached ENS name.
 *
 * @param address - The address to lookup.
 * @param chainId - The chain ID for the cached ENS name (optional).
 * @returns The cached ENS name, or undefined if the name
 * was not found in the cache.
 */
export function getCachedENSName(
  address: EthAddress,
  chainId?: HexChainId,
): ENSDomainName | undefined {
  if (!chainId) {
    return undefined;
  }
  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(chainId);
  if (!networkHasEnsSupport) {
    return undefined;
  }

  const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
  const cacheEntry = ENSCache.cache[networkId + address];

  return cacheEntry?.name;
}

/**
 * Perform a reverse ENS lookup to get the ENS name for an address.
 *
 * @param address - The Ethereum address to lookup.
 * @param chainId - The chain ID for the lookup (optional).
 * @returns The ENS name if found, or undefined.
 */
export async function doENSReverseLookup(
  address: EthAddress,
  chainId?: HexChainId,
): Promise<ENSDomainName | undefined> {
  if (!chainId) {
    return undefined;
  }
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();
  const { name: cachedName, timestamp } =
    ENSCache.cache[chainId + address] || {};
  const nowTimestamp = Date.now();
  if (timestamp && nowTimestamp - timestamp < CACHE_REFRESH_THRESHOLD) {
    return Promise.resolve(cachedName);
  }

  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(chainId);

  if (networkHasEnsSupport) {
    const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
    const ens: ENSInstance = new ENS({ provider, network: networkId });
    try {
      const name = await ens.reverse(address);
      const resolvedAddress = await ens.lookup(name);
      if (toLowerCaseEquals(address, resolvedAddress)) {
        ENSCache.cache[networkId + address] = { name, timestamp: Date.now() };
        return name;
      }
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes(ENS_NAME_NOT_DEFINED_ERROR) ||
          e.message.includes(INVALID_ENS_NAME_ERROR))
      ) {
        ENSCache.cache[networkId + address] = { timestamp: Date.now() };
      }
    }
  }
  return undefined;
}

/**
 * Perform an ENS lookup to resolve an ENS name to an address.
 *
 * @param ensName - The ENS name to resolve.
 * @param chainId - The chain ID for the lookup (optional).
 * @returns The resolved Ethereum address, or null if not found.
 */
export async function doENSLookup(
  ensName: ENSDomainName,
  chainId?: HexChainId,
): Promise<EthAddress | null> {
  if (!chainId) {
    return null;
  }
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();

  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(chainId);

  if (networkHasEnsSupport) {
    const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
    const ens: ENSInstance = new ENS({ provider, network: networkId });
    try {
      const resolvedAddress = await ens.lookup(ensName);
      if (resolvedAddress === EMPTY_ADDRESS) return null;
      return resolvedAddress;
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
  return null;
}

/**
 * Check if an account name matches the default account naming pattern.
 *
 * @param name - The account name to check.
 * @returns True if the name matches the default pattern (e.g., "Account 1").
 */
export function isDefaultAccountName(name: string | undefined): boolean {
  if (!name) return false;
  return regex.defaultAccount.test(name);
}
