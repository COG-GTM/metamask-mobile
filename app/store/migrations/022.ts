import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 22: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 22: Invalid root engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 22: Invalid root engine backgroundState: '${typeof state.engine.backgroundState}'`,
      ),
    );
    return state;
  }

  const preferencesController = state.engine.backgroundState
    .PreferencesController as Record<string, unknown> | undefined;

  if (isObject(preferencesController) && preferencesController.openSeaEnabled) {
    preferencesController.displayNftMedia =
      (preferencesController.openSeaEnabled as boolean) ?? true;
    delete preferencesController.openSeaEnabled;
  }

  if (isObject(state.user) && state.user.nftDetectionDismissed) {
    delete state.user.nftDetectionDismissed;
  }

  return state;
}
