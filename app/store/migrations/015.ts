import * as ControllerUtils from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

// `NetworksChainId` was previously exported from `@metamask/controller-utils`
// but has been removed. Cast through unknown to preserve the original
// (broken) runtime behavior without altering it.
const NetworksChainId = (
  ControllerUtils as unknown as {
    NetworksChainId?: Record<string, string>;
  }
).NetworksChainId as Record<string, string>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
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
