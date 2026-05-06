import { isObject, hasProperty } from '@metamask/utils';
// @ts-expect-error Frozen migration: `isSafeChainId` was removed from `../../util/networks`. Preserved as-is.
import { getAllNetworks, isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

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

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    !!provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(String(provider.chainId), 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}
