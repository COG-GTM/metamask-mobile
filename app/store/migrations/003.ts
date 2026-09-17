// `NetworksChainId` was removed from `@metamask/controller-utils` after this
// migration was written. The import is left untouched so this historical
// migration keeps its current runtime behaviour.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - `NetworksChainId` is no longer exported by @metamask/controller-utils
import { NetworksChainId } from '@metamask/controller-utils';
// `isSafeChainId` is not exported by `app/util/networks`. The import is left
// untouched so this historical migration keeps its current runtime behaviour.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - `isSafeChainId` is not exported by app/util/networks
import { isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

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
  const chainId = NetworksChainId[provider.type as string];
  // if chainId === '' is a rpc
  if (chainId) {
    migrationState.engine.backgroundState.NetworkController.provider = {
      ...provider,
      chainId,
    };
    return state;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    migrationState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return state;
}
