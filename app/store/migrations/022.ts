export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine?: {
      backgroundState?: {
        PreferencesController?: {
          openSeaEnabled?: boolean;
          displayNftMedia?: boolean;
        };
      };
    };
    user?: { nftDetectionDismissed?: boolean };
  };
  const preferencesController =
    typedState?.engine?.backgroundState?.PreferencesController;
  if (preferencesController?.openSeaEnabled) {
    preferencesController.displayNftMedia =
      preferencesController.openSeaEnabled ?? true;

    delete preferencesController.openSeaEnabled;
  }
  if (typedState?.user?.nftDetectionDismissed) {
    delete typedState.user.nftDetectionDismissed;
  }

  return typedState;
}
