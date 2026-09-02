import { hasProperty, isObject } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }

  const preferencesControllerState =
    hasProperty(state, 'engine') &&
    isObject(state.engine) &&
    hasProperty(state.engine, 'backgroundState') &&
    isObject(state.engine.backgroundState)
      ? state.engine.backgroundState.PreferencesController
      : undefined;

  if (
    isObject(preferencesControllerState) &&
    hasProperty(preferencesControllerState, 'openSeaEnabled') &&
    preferencesControllerState.openSeaEnabled
  ) {
    preferencesControllerState.displayNftMedia =
      preferencesControllerState.openSeaEnabled ?? true;

    delete preferencesControllerState.openSeaEnabled;
  }
  if (
    hasProperty(state, 'user') &&
    isObject(state.user) &&
    hasProperty(state.user, 'nftDetectionDismissed') &&
    state.user.nftDetectionDismissed
  ) {
    delete state.user.nftDetectionDismissed;
  }

  return state;
}
