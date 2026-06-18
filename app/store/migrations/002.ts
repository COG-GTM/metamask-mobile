import { isObject } from '@metamask/utils';
import { isSafeChainId, toHex } from '@metamask/controller-utils';
import { getAllNetworks } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const networkController = state.engine.backgroundState
    .NetworkController as Record<string, unknown> | undefined;
  if (!isObject(networkController)) return state;

  const provider = networkController.provider as Record<string, unknown> | undefined;
  if (!isObject(provider)) return state;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type as string);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId as string, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(toHex(chainIdNumber));

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}
