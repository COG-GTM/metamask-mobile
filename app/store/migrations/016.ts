import { hasProperty, isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 16)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;

  if (!isObject(networkControllerState)) {
    return state;
  }

  if (
    hasProperty(networkControllerState, 'properties') &&
    networkControllerState.properties
  ) {
    networkControllerState.networkDetails = networkControllerState.properties;
    delete networkControllerState.properties;
  }
  return state;
}
