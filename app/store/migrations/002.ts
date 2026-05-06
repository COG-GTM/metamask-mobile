import { getAllNetworks } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

const MAX_SAFE_CHAIN_ID = 4503599627370476;

// Replicates the historical isSafeChainId(decimal) check used at the time
// this migration was written.
function isSafeChainIdLegacy(chainId: number): boolean {
  return (
    Number.isSafeInteger(chainId) &&
    chainId > 0 &&
    chainId <= MAX_SAFE_CHAIN_ID
  );
}

interface ProviderConfig {
  type?: string;
  chainId?: string;
  ticker?: string;
}

export default function migrate(state: unknown): unknown {
  const typedState = state as {
    engine: {
      backgroundState: {
        NetworkController: { provider: ProviderConfig };
      };
    };
  };
  const provider =
    typedState.engine.backgroundState.NetworkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId ?? '', 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainIdLegacy(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    typedState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}
