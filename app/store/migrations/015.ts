// @ts-expect-error `NetworksChainId` was removed from @metamask/controller-utils; legacy migration kept as-is
import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

interface LegacyState {
  engine: {
    backgroundState: {
      NetworkController: {
        providerConfig: {
          chainId?: string;
          ticker?: string;
          type?: string;
          [key: string]: unknown;
        };
      };
    };
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
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
