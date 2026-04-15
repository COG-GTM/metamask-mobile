import { NetworksChainId } from '@metamask/controller-utils';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { GOERLI } from '../../../app/constants/network';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 15: Invalid root state: '${typeof state}'`),
    );
    return state;
  }
  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 15: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 15: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState.NetworkController)) {
    captureException(
      new Error(
        `Migration 15: Invalid NetworkController state: '${typeof state.engine
          .backgroundState.NetworkController}'`,
      ),
    );
    return state;
  }

  const networkController = state.engine.backgroundState
    .NetworkController as Record<string, unknown>;
  const providerConfig = networkController.providerConfig as Record<
    string,
    unknown
  >;
  const chainId = providerConfig.chainId;
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
