import { isObject } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) return state;

  const engine = state.engine as { backgroundState?: unknown } | undefined;
  const backgroundState = engine?.backgroundState as
    | Record<string, unknown>
    | undefined;
  const preferencesController = backgroundState?.PreferencesController as
    | {
        openSeaEnabled?: boolean;
        displayNftMedia?: boolean;
        [key: string]: unknown;
      }
    | undefined;

  if (preferencesController?.openSeaEnabled) {
    preferencesController.displayNftMedia =
      preferencesController.openSeaEnabled ?? true;

    delete preferencesController.openSeaEnabled;
  }
  const user = state.user as
    | { nftDetectionDismissed?: unknown; [key: string]: unknown }
    | undefined;
  if (user?.nftDetectionDismissed) {
    delete user.nftDetectionDismissed;
  }

  return state;
}
