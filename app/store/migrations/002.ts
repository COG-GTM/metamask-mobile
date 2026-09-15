// @ts-expect-error `isSafeChainId` is not exported from util/networks; legacy migration kept as-is
import { getAllNetworks, isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

interface LegacyProvider {
  type?: string;
  chainId?: string;
  ticker?: string;
  [key: string]: unknown;
}

interface LegacyState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: LegacyProvider;
      };
    };
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
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
