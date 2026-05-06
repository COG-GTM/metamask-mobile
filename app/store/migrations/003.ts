import { isObject, hasProperty } from '@metamask/utils';
// @ts-expect-error Frozen migration: `NetworksChainId` was removed from `@metamask/controller-utils`. Preserved as-is.
import { NetworksChainId } from '@metamask/controller-utils';
// @ts-expect-error Frozen migration: `isSafeChainId` was removed from `../../util/networks`. Preserved as-is.
import { isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

interface ProviderConfig {
  type?: string;
  chainId?: string | number;
  ticker?: string;
  [key: string]: unknown;
}

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const networkController = state.engine.backgroundState.NetworkController;
  if (
    !isObject(networkController) ||
    !hasProperty(networkController, 'provider') ||
    !isObject(networkController.provider)
  ) {
    return state;
  }
  const provider = networkController.provider as ProviderConfig;
  const networksChainId = NetworksChainId as Record<string, string>;
  const chainId = provider.type ? networksChainId[provider.type] : undefined;
  // if chainId === '' is a rpc
  if (chainId) {
    networkController.provider = {
      ...provider,
      chainId,
    };
    return state;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: networksChainId.goerli,
    };
  }
  return state;
}
