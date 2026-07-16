import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 16)) {
    return state;
  }

  const networkController = state.engine.backgroundState.NetworkController;
  if (!isObject(networkController)) {
    return state;
  }

  if (networkController.properties) {
    networkController.networkDetails = networkController.properties;
    delete networkController.properties;
  }
  return state;
}
