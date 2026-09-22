import { hasProperty, isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 14)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;

  if (!isObject(networkControllerState)) {
    return state;
  }

  if (
    hasProperty(networkControllerState, 'provider') &&
    networkControllerState.provider
  ) {
    networkControllerState.providerConfig = networkControllerState.provider;
    delete networkControllerState.provider;
  }

  return state;
}
