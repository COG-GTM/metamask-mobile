// @ts-expect-error isSafeChainId is not exported from this module; retained to preserve the original migration behavior.
import { getAllNetworks, isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

interface NetworkProvider {
  type?: string;
  chainId?: string;
  ticker?: string;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: NetworkProvider;
      };
    };
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
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
  return typedState as unknown as Record<string, unknown>;
}
