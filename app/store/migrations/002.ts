// @ts-expect-error `isSafeChainId` no longer exists in util/networks (pre-existing broken import)
import { getAllNetworks, isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

interface LegacyProvider {
  type?: string;
  chainId?: string;
  ticker?: string;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: LegacyProvider;
      };
    };
  };
}

export default function migrate(untypedState: unknown) {
  const state = untypedState as MigrationState;
  const provider = state.engine.backgroundState.NetworkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(String(provider.chainId), 10);
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
