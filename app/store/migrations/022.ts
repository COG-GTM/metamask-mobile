import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    return state as Record<string, unknown>;
  }

  if (
    isObject(state.engine) &&
    isObject((state.engine as Record<string, unknown>).backgroundState)
  ) {
    const backgroundState = (state.engine as Record<string, unknown>).backgroundState as Record<string, unknown>;

    if (
      isObject(backgroundState.PreferencesController) &&
      (backgroundState.PreferencesController as Record<string, unknown>).openSeaEnabled
    ) {
      const preferencesController = backgroundState.PreferencesController as Record<string, unknown>;
      preferencesController.displayNftMedia =
        preferencesController.openSeaEnabled ?? true;
      delete preferencesController.openSeaEnabled;
    }
  }

  if (
    isObject(state.user) &&
    (state.user as Record<string, unknown>).nftDetectionDismissed
  ) {
    delete (state.user as Record<string, unknown>).nftDetectionDismissed;
  }

  return state as Record<string, unknown>;
}
