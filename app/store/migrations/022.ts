export default function migrate(state: Record<string, unknown>) {
  const engineState = state?.engine as Record<string, Record<string, Record<string, unknown>>> | undefined;
  const preferencesController = engineState?.backgroundState?.PreferencesController as Record<string, unknown> | undefined;
  if (preferencesController?.openSeaEnabled) {
    preferencesController.displayNftMedia =
      preferencesController.openSeaEnabled ?? true;

    delete preferencesController.openSeaEnabled;
  }
  const user = state?.user as Record<string, unknown> | undefined;
  if (user?.nftDetectionDismissed) {
    delete user.nftDetectionDismissed;
  }

  return state;
}
