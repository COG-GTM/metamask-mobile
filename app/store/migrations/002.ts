import { getAllNetworks } from '../../util/networks';
import { isSafeChainId, toHex } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  const provider = state.engine.backgroundState.NetworkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(toHex(chainIdNumber));

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    state.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}
