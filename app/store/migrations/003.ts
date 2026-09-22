// @ts-expect-error This export no longer exists in the current version; migration retained for historical persisted state.
import { NetworksChainId } from '@metamask/controller-utils';
// @ts-expect-error This export no longer exists in the current version; migration retained for historical persisted state.
import { isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

interface Provider {
  type: string;
  chainId?: string;
  ticker?: string;
}

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider: Provider;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  const provider = typedState.engine.backgroundState.NetworkController.provider;
  const chainId =
    NetworksChainId[provider.type as keyof typeof NetworksChainId];
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
