import { hasProperty, isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 22)) {
    return state;
  }

  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;

  if (
    isObject(preferencesControllerState) &&
    preferencesControllerState.openSeaEnabled
  ) {
    preferencesControllerState.displayNftMedia =
      preferencesControllerState.openSeaEnabled ?? true;

    delete preferencesControllerState.openSeaEnabled;
  }

  const userState = hasProperty(state, 'user') ? state.user : undefined;

  if (isObject(userState) && userState.nftDetectionDismissed) {
    delete userState.nftDetectionDismissed;
  }

  return state;
}
