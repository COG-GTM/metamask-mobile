import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 22: Invalid root state: root state is not an object`),
    );
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedState = state as Record<string, any>;
  if (typedState?.engine?.backgroundState?.PreferencesController?.openSeaEnabled) {
    typedState.engine.backgroundState.PreferencesController.displayNftMedia =
      typedState.engine.backgroundState.PreferencesController.openSeaEnabled ?? true;

    delete typedState.engine.backgroundState.PreferencesController.openSeaEnabled;
  }
  if (typedState?.user?.nftDetectionDismissed) {
    delete typedState.user.nftDetectionDismissed;
  }

  return typedState;
}
