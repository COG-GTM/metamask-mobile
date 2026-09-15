import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 14)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;
  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 14: Invalid NetworkController state: '${typeof networkControllerState}'`,
      ),
    );
    return state;
  }

  if (networkControllerState.provider) {
    networkControllerState.providerConfig = networkControllerState.provider;
    delete networkControllerState.provider;
  }

  return state;
}
