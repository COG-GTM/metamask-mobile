import {
  getAllNetworks,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error - `isSafeChainId` is no longer exported by `../../util/networks`;
  // the import is preserved as-is to keep this legacy migration's behaviour unchanged.
  isSafeChainId,
} from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: {
          type?: string;
          chainId?: string;
          ticker?: string;
        };
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
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
