import { isObject, hasProperty } from '@metamask/utils';
// @ts-expect-error Frozen migration: `NetworksChainId` was removed from `@metamask/controller-utils`. Preserved as-is.
import { NetworksChainId } from '@metamask/controller-utils';
import { GOERLI } from '../../../app/constants/network';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const networkController = state.engine.backgroundState.NetworkController;
  if (
    !isObject(networkController) ||
    !hasProperty(networkController, 'providerConfig') ||
    !isObject(networkController.providerConfig)
  ) {
    return state;
  }
  const chainId = networkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    networkController.providerConfig = {
      chainId: (NetworksChainId as Record<string, string>).goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}
