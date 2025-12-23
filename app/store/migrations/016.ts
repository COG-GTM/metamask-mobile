import { isObject, hasProperty } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;
  if (!isObject(networkControllerState)) {
    return state;
  }

  if (hasProperty(networkControllerState, 'properties')) {
    networkControllerState.networkDetails = networkControllerState.properties;
    delete networkControllerState.properties;
  }
  return state;
}
