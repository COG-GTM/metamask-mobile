import Engine from '../core/Engine';
import ENS from 'ethjs-ens';
import { toLowerCaseEquals } from './general';
import { regex } from '../../app/util/regex';
import { isSiweMessage } from '@metamask/controller-utils';

class ENSCache {
  static cache: Record<string, Record<string, string | null>> = {};
}

export function getCachedENSName(address: string, chainId: string): string | null {
  const chain = ENSCache.cache[chainId];
  if (!chain) return null;
  return chain[address] ?? null;
}

export async function doENSReverseLookup(address: string, chainId: string): Promise<string | undefined> {
  const cached = getCachedENSName(address, chainId);
  if (cached) {
    return cached;
  }

  const { NetworkController } = Engine.context;
  const networkClientId =
    NetworkController.findNetworkClientIdByChainId(chainId);
  const networkClient = NetworkController.getNetworkClientById(networkClientId);

  const provider = networkClient?.provider;

  const ens = new ENS({ provider, network: chainId });

  try {
    const name = await ens.reverse(address);
    const resolvedAddress = await ens.lookup(name);

    if (toLowerCaseEquals(address, resolvedAddress)) {
      if (!ENSCache.cache[chainId]) {
        ENSCache.cache[chainId] = {};
      }
      ENSCache.cache[chainId][address] = name;
      return name;
    }
  } catch (e) {
    // ENS lookup failed
  }
  return undefined;
}

export async function doENSLookup(ensName: string, chainId: string): Promise<string | undefined> {
  const { NetworkController } = Engine.context;
  const networkClientId =
    NetworkController.findNetworkClientIdByChainId(chainId);
  const networkClient = NetworkController.getNetworkClientById(networkClientId);

  const provider = networkClient?.provider;

  const ens = new ENS({ provider, network: chainId });

  try {
    const resolvedAddress = await ens.lookup(ensName);
    if (resolvedAddress && resolvedAddress !== '0x') {
      return resolvedAddress;
    }
  } catch (e) {
    // ENS lookup failed
  }
  return undefined;
}

export function isDefaultAccountName(name: string): boolean {
  return regex.defaultAccountName.test(name);
}

export { isSiweMessage };
