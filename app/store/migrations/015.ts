// `NetworksChainId` is no longer exported by `@metamask/controller-utils`.
// This migration predates its removal and is kept as-is so that runtime
// behavior is unchanged.
// @ts-expect-error Missing export in `@metamask/controller-utils`
import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

interface Migration015State {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId?: string;
          ticker?: string;
          type?: string;
        };
      };
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration015State;
  const chainId =
    state.engine.backgroundState.NetworkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    state.engine.backgroundState.NetworkController.providerConfig = {
      chainId: NetworksChainId.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}
