// `NetworksChainId` was removed from `@metamask/controller-utils` after this
// migration was written. The import is left untouched so this historical
// migration keeps its current runtime behaviour.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - `NetworksChainId` is no longer exported by @metamask/controller-utils
import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

interface ProviderConfig {
  chainId?: string;
  ticker?: string;
  type?: string;
}

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: ProviderConfig;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  const chainId =
    migrationState.engine.backgroundState.NetworkController.providerConfig
      .chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    migrationState.engine.backgroundState.NetworkController.providerConfig = {
      chainId: NetworksChainId.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}
