import { isObject, hasProperty } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (isObject(state.engine) && isObject(state.engine.backgroundState)) {
    const preferencesControllerState = state.engine.backgroundState.PreferencesController as Record<string, unknown> | undefined;
    if (preferencesControllerState && hasProperty(preferencesControllerState, 'openSeaEnabled') && preferencesControllerState.openSeaEnabled) {
      preferencesControllerState.displayNftMedia = preferencesControllerState.openSeaEnabled ?? true;
      delete preferencesControllerState.openSeaEnabled;
    }
  }

  const user = state.user as Record<string, unknown> | undefined;
  if (user && hasProperty(user, 'nftDetectionDismissed')) {
    delete user.nftDetectionDismissed;
  }

  return state;
}
