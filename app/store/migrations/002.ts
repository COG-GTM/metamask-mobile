// `isSafeChainId` is not exported by `app/util/networks`. The import is left
// untouched so this historical migration keeps its current runtime behaviour.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - `isSafeChainId` is not exported by app/util/networks
import { getAllNetworks, isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';

interface NetworkProvider {
  type?: string;
  chainId?: string;
  ticker?: string;
}

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: NetworkProvider;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  const provider =
    migrationState.engine.backgroundState.NetworkController.provider;

  // Check if the current network is one of the initial networks
  const isInitialNetwork =
    provider.type && getAllNetworks().includes(provider.type);

  // Check if the current network has a valid chainId
  const chainIdNumber = parseInt(provider.chainId as string, 10);
  const isCustomRpcWithInvalidChainId = !isSafeChainId(chainIdNumber);

  if (!isInitialNetwork && isCustomRpcWithInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    migrationState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
    };
  }
  return state;
}
