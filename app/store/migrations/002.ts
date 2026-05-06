import { getAllNetworks } from '../../util/networks';
import * as networksModule from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

// `isSafeChainId` was historically exported from this module but was removed
// (see commit e571db750d). The destructured import here was never updated, so
// at runtime `isSafeChainId` is undefined. We cast through unknown to preserve
// the original (broken) runtime behavior without altering it.
const isSafeChainId = (
  networksModule as unknown as {
    isSafeChainId?: (chainId: number) => boolean;
  }
).isSafeChainId as (chainId: number) => boolean;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
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
