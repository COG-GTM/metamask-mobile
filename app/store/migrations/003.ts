// @ts-expect-error `NetworksChainId` was removed from @metamask/controller-utils (pre-existing broken import)
import { NetworksChainId } from '@metamask/controller-utils';
// @ts-expect-error `isSafeChainId` no longer exists in util/networks (pre-existing broken import)
import { isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

interface LegacyProvider {
  type: string;
  chainId?: unknown;
  ticker?: string;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: LegacyProvider;
      };
    };
  };
}

export default function migrate(untypedState: unknown) {
  const state = untypedState as MigrationState;
  const provider = state.engine.backgroundState.NetworkController.provider;
  const chainId = NetworksChainId[provider.type];
  // if chainId === '' is a rpc
  if (chainId) {
    state.engine.backgroundState.NetworkController.provider = {
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
    state.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return state;
}
