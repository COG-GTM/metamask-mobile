// @ts-expect-error NetworksChainId was removed from @metamask/controller-utils; retained for this legacy migration where it resolves to undefined at runtime.
import { NetworksChainId } from '@metamask/controller-utils';
import AppConstants from '../../core/AppConstants';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

function isSafeChainId(chainId: number): boolean {
  return (
    Number.isSafeInteger(chainId) &&
    chainId > 0 &&
    chainId <= AppConstants.MAX_SAFE_CHAIN_ID
  );
}

interface ProviderConfig {
  type?: string;
  chainId?: string;
  ticker?: string;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: { backgroundState: { NetworkController: { provider: ProviderConfig } } };
  };
  const provider = typedState.engine.backgroundState.NetworkController.provider;
  const chainId = NetworksChainId[provider.type as string];
  // if chainId === '' is a rpc
  if (chainId) {
    typedState.engine.backgroundState.NetworkController.provider = {
      ...provider,
      chainId,
    };
    return typedState;
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
  return typedState;
}
