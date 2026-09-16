// @ts-expect-error `NetworksChainId` was removed from @metamask/controller-utils (pre-existing broken import)
import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId?: unknown;
          ticker?: string;
          type?: string;
          [key: string]: unknown;
        };
      };
    };
  };
}

export default function migrate(untypedState: unknown) {
  const state = untypedState as MigrationState;
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
