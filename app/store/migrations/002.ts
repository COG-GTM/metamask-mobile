import { isObject } from '@metamask/utils';
import { isSafeChainId, toHex } from '@metamask/controller-utils';
import { getAllNetworks } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 2)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;

  if (
    !isObject(networkControllerState) ||
    !isObject(networkControllerState.provider)
  ) {
    return state;
  }

  const { provider } = networkControllerState;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    typeof provider.type === 'string' &&
    getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(String(provider.chainId), 10);
  const isCustomRpcWithInvalidChainId =
    !Number.isSafeInteger(chainIdNumber) ||
    chainIdNumber <= 0 ||
    !isSafeChainId(toHex(chainIdNumber));

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkControllerState.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}
