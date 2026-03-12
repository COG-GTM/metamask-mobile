export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  if (s?.engine?.backgroundState?.PreferencesController?.openSeaEnabled) {
    s.engine.backgroundState.PreferencesController.displayNftMedia =
      s.engine.backgroundState.PreferencesController.openSeaEnabled ?? true;

    delete s.engine.backgroundState.PreferencesController.openSeaEnabled;
  }
  if (s?.user?.nftDetectionDismissed) {
    delete s.user.nftDetectionDismissed;
  }

  return s;
}
