export default function migrate(state: unknown): unknown {
  const s = state as {
    engine: { backgroundState: { PreferencesController: Record<string, unknown> } };
    user?: Record<string, unknown>;
  };
  if (s?.engine?.backgroundState?.PreferencesController?.openSeaEnabled) {
    s.engine.backgroundState.PreferencesController.displayNftMedia =
      s.engine.backgroundState.PreferencesController.openSeaEnabled ?? true;

    delete s.engine.backgroundState.PreferencesController.openSeaEnabled;
  }
  if (s?.user?.nftDetectionDismissed) {
    delete s.user.nftDetectionDismissed;
  }

  return state;
}
