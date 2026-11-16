import { getAllNetworks } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import AppConstants from '../../core/AppConstants';

const isSafeChainId = (chainId) =>
  Number.isSafeInteger(chainId) &&
  chainId > 0 &&
  chainId <= AppConstants.MAX_SAFE_CHAIN_ID;

export default function migrate(state) {
  const provider = state.engine.backgroundState.NetworkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    state.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}
