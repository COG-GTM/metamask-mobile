import { getAllNetworks } from '../../util/networks';
import { MAX_SAFE_CHAIN_ID } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

// Mirrors the historical `isSafeChainId` from app/util/networks, which
// accepted a decimal number (the current controller-utils version only
// accepts 0x-prefixed hex strings).
const isSafeChainId = (chainId: number): boolean =>
  Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID;

/* eslint-disable @typescript-eslint/no-explicit-any */
// Legacy persisted state is expected to contain engine.backgroundState.
export default function migrate(state: unknown): Record<string, unknown>;
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
