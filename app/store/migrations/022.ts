import { isObject } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }

  const preferencesController =
    isObject(state.engine) && isObject(state.engine.backgroundState)
      ? state.engine.backgroundState.PreferencesController
      : undefined;

  if (isObject(preferencesController) && preferencesController.openSeaEnabled) {
    preferencesController.displayNftMedia =
      preferencesController.openSeaEnabled ?? true;

    delete preferencesController.openSeaEnabled;
  }
  if (isObject(state.user) && state.user.nftDetectionDismissed) {
    delete state.user.nftDetectionDismissed;
  }

  return state;
}
