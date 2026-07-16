import { isObject } from '@metamask/utils';
import { GOERLI } from '../../../app/constants/network';
import { ensureValidState } from './util';
import { NetworksChainId } from './util/legacyNetworks';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 15)) {
    return state;
  }

  const networkController = state.engine.backgroundState.NetworkController;
  if (!isObject(networkController) || !isObject(networkController.providerConfig)) {
    return state;
  }

  const chainId = networkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    networkController.providerConfig = {
      chainId: NetworksChainId.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}
