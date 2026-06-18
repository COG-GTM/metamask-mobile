import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const preferencesController = state.engine.backgroundState
    .PreferencesController as Record<string, unknown> | undefined;

  if (isObject(preferencesController) && preferencesController.openSeaEnabled) {
    preferencesController.displayNftMedia =
      preferencesController.openSeaEnabled ?? true;
    delete preferencesController.openSeaEnabled;
  }

  const user = state.user as Record<string, unknown> | undefined;
  if (isObject(user) && user.nftDetectionDismissed) {
    delete user.nftDetectionDismissed;
  }

  return state;
}
