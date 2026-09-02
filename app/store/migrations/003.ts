// `NetworksChainId` is no longer exported by `@metamask/controller-utils`.
// This migration predates its removal and is kept as-is so that runtime
// behavior is unchanged.
// @ts-expect-error Missing export in `@metamask/controller-utils`
import { NetworksChainId } from '@metamask/controller-utils';
// `isSafeChainId` is no longer exported by `app/util/networks`, same as above.
// @ts-expect-error Missing export in `app/util/networks`
import { isSafeChainId } from '../../util/networks';
import { GOERLI } from '../../../app/constants/network';
import { regex } from '../../../app/util/regex';

interface Migration003State {
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

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration003State;
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
