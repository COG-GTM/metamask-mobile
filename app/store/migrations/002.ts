// @ts-expect-error - `isSafeChainId` is no longer exported from util/networks; import kept to preserve the legacy runtime behavior of this migration
import { getAllNetworks, isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

interface ProviderConfig {
  type?: string;
  chainId?: string;
  ticker?: string;
  [key: string]: unknown;
}

// Legacy persisted state shape expected by this migration
interface StateWithNetworkProvider {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: ProviderConfig;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as StateWithNetworkProvider;
  const provider = typedState.engine.backgroundState.NetworkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId as string, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    typedState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return typedState;
}
