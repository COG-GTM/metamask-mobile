import type { MigrationState } from './migration-types';
import { getAllNetworks } from '../../util/networks';

// isSafeChainId was removed from dependencies. Inline the historical logic.
const isSafeChainId = (chainId: number): boolean =>
  Number.isSafeInteger(chainId) && chainId > 0 && chainId <= 4503599627370476;
import { GOERLI } from '../../../app/constants/network';

export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
  const provider = state.engine.backgroundState.NetworkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId as string, 10);
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
