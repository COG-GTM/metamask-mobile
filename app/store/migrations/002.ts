import { getAllNetworks, isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

interface ProviderConfig {
  type?: string;
  chainId?: string;
  ticker?: string;
  [key: string]: unknown;
}

interface Migration002State {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: ProviderConfig;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration002State;
  const provider =
    migratedState.engine.backgroundState.NetworkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId as string, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    migratedState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return migratedState;
}
