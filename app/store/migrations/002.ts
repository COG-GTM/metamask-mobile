import { isObject } from '@metamask/utils';
import { getAllNetworks } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { ensureValidState } from './util';
import { isSafeChainId } from './util/legacyNetworks';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 2)) {
    return state;
  }

  const networkController = state.engine.backgroundState.NetworkController;
  if (!isObject(networkController) || !isObject(networkController.provider)) {
    return state;
  }

  const provider = networkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    typeof provider.type === 'string' &&
    getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId as string, 10);
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
