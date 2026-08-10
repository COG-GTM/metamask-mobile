// eslint-disable-next-line import/no-namespace
import * as controllerUtils from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

// `NetworksChainId` was removed from `@metamask/controller-utils` after this
// migration was written, so it is read off the module to keep this migration
// behaving exactly as it did before.
const { NetworksChainId } = controllerUtils as unknown as {
  NetworksChainId: Record<string, string>;
};

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId: string;
          ticker?: string;
          type?: string;
        };
      };
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as MigrationState;
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
