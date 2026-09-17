import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 10)) {
    return state;
  }

  const preferencesController =
    state.engine.backgroundState.PreferencesController;
  if (!isObject(preferencesController)) {
    return state;
  }

  state.engine.backgroundState.PreferencesController = {
    ...preferencesController,
    useCollectibleDetection: false,
    openSeaEnabled: false,
  };
  return state;
}
