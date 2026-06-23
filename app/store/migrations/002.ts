import { getAllNetworks } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

// `isSafeChainId` is not exported by util/networks; at runtime it is `undefined`,
// preserving this dormant migration's original behavior.
const isSafeChainId = undefined as unknown as (chainId: number) => boolean;

interface ProviderConfig {
  type?: string;
  chainId?: string;
  ticker?: string;
}

export default function migrate(state: unknown): Record<string, unknown> {
  // Expected shape: state.engine.backgroundState.NetworkController.provider
  const { backgroundState } = (
    state as {
      engine: { backgroundState: Record<string, Record<string, unknown>> };
    }
  ).engine;
  const provider = backgroundState.NetworkController
    .provider as ProviderConfig;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId as string, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state as Record<string, unknown>;
}
