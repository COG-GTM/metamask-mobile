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
    hasProperty(networkController, 'provider') &&
    networkController.provider
  ) {
    networkController.providerConfig = networkController.provider;
    delete networkController.provider;
  }

  return state;
}
