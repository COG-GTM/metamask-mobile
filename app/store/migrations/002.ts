import { isObject, hasProperty } from '@metamask/utils';
import { getAllNetworks } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

// Safe chain ID check - chain ID must be a positive integer less than MAX_SAFE_CHAIN_ID
const MAX_SAFE_CHAIN_ID = 4503599627370476;
const isSafeChainId = (chainId: number): boolean =>
  Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID;

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;
  if (!isObject(networkControllerState)) {
    return state;
  }

  if (!hasProperty(networkControllerState, 'provider') || !isObject(networkControllerState.provider)) {
    return state;
  }

  const provider = networkControllerState.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    typeof provider.type === 'string' && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdString = typeof provider.chainId === 'string' ? provider.chainId : '0';
  const chainIdNumber = parseInt(chainIdString, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkControllerState.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}
