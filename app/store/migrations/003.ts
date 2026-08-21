// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error `NetworksChainId` was removed from `@metamask/controller-utils`.
// The import is preserved as-is so this migration keeps its current runtime behaviour.
import { NetworksChainId } from '@metamask/controller-utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error `isSafeChainId` is no longer exported by `../../util/networks`.
// The import is preserved as-is so this migration keeps its current runtime behaviour.
import { isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

interface ProviderConfig {
  type: string;
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
  const chainId = NetworksChainId[provider.type];
  // if chainId === '' is a rpc
  if (chainId) {
    networkControllerState.provider = {
      ...provider,
      chainId,
    };
    return state as Record<string, unknown>;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    networkControllerState.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return state as Record<string, unknown>;
}
