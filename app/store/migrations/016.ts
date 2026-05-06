import { isObject, hasProperty } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const networkController = state.engine.backgroundState.NetworkController;
  if (
    isObject(networkController) &&
    hasProperty(networkController, 'properties')
  ) {
    networkController.networkDetails = networkController.properties;
    delete networkController.properties;
  }
  return state;
}
