// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error `isSafeChainId` is no longer exported by `../../util/networks`.
// The import is preserved as-is so this migration keeps its current runtime behaviour.
import { getAllNetworks, isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

interface ProviderConfig {
  type?: string;
  chainId?: string;
  ticker?: string;
}

/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: ProviderConfig;
      };
    };
  };
}

export default function migrate(state: unknown): Record<string, unknown> {
  const networkControllerState = (state as MigrationState).engine
    .backgroundState.NetworkController;
  const provider = networkControllerState.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId as string, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkControllerState.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state as Record<string, unknown>;
}
