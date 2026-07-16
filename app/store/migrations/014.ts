import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 14)) {
    return state;
  }

  const networkController = state.engine.backgroundState.NetworkController;
  if (!isObject(networkController)) {
    return state;
  }

  if (networkController.provider) {
    networkController.providerConfig = networkController.provider;
    delete networkController.provider;
  }

  return state;
}
