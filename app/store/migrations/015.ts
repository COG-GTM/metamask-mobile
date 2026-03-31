import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { GOERLI } from '../../../app/constants/network';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 15: Invalid root state: root state is not an object`),
    );
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedState = state as Record<string, any>;
  const chainId =
    typedState.engine.backgroundState.NetworkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    typedState.engine.backgroundState.NetworkController.providerConfig = {
      chainId: '5',
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return typedState;
}
