import { isObject, hasProperty } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (isObject(state.engine) && isObject(state.engine.backgroundState)) {
    const preferencesController =
      state.engine.backgroundState.PreferencesController;
    if (
      isObject(preferencesController) &&
      hasProperty(preferencesController, 'openSeaEnabled') &&
      preferencesController.openSeaEnabled
    ) {
      preferencesController.displayNftMedia =
        preferencesController.openSeaEnabled ?? true;

      delete preferencesController.openSeaEnabled;
    }
  }
  if (
    isObject(state.user) &&
    hasProperty(state.user, 'nftDetectionDismissed')
  ) {
    delete state.user.nftDetectionDismissed;
  }

  return state;
}
