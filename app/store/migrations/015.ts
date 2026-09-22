import { isObject } from '@metamask/utils';
import { GOERLI } from '../../../app/constants/network';
import { NETWORKS_CHAIN_ID } from './migration-data/networks-chain-id';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 15)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;

  if (
    !isObject(networkControllerState) ||
    !isObject(networkControllerState.providerConfig)
  ) {
    return state;
  }

  const { chainId } = networkControllerState.providerConfig;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    networkControllerState.providerConfig = {
      chainId: NETWORKS_CHAIN_ID.goerli,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}
