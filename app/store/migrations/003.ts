// @ts-expect-error NetworksChainId was removed from @metamask/controller-utils in a later version; retained to preserve the original migration behavior.
import { NetworksChainId } from '@metamask/controller-utils';
// @ts-expect-error isSafeChainId is not exported from this module; retained to preserve the original migration behavior.
import { isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

interface NetworkProvider {
  type?: string;
  chainId?: unknown;
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
  const chainId = NetworksChainId[provider.type as string];
  // if chainId === '' is a rpc
  if (chainId) {
    typedState.engine.backgroundState.NetworkController.provider = {
      ...provider,
      chainId,
    };
    return typedState as unknown as Record<string, unknown>;
  }

  // If provider is rpc, check if the current network has a valid chainId
  const storedChainId =
    typeof provider.chainId === 'string' ? provider.chainId : '';
  const isDecimalString = regex.decimalStringMigrations.test(storedChainId);
  const hasInvalidChainId =
    !isDecimalString || !isSafeChainId(parseInt(storedChainId, 10));

  if (hasInvalidChainId) {
    // If the current network does not have a chainId, switch to testnet.
    typedState.engine.backgroundState.NetworkController.provider = {
      ticker: 'ETH',
      type: GOERLI,
      chainId: NetworksChainId.goerli,
    };
  }
  return typedState as unknown as Record<string, unknown>;
}
