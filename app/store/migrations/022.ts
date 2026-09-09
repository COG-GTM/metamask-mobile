interface MigrationState {
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        openSeaEnabled?: boolean;
        displayNftMedia?: boolean;
      };
    };
  };
  user?: {
    nftDetectionDismissed?: unknown;
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as MigrationState;
  if (
    typedState?.engine?.backgroundState?.PreferencesController?.openSeaEnabled
  ) {
    typedState.engine.backgroundState.PreferencesController.displayNftMedia =
      typedState.engine.backgroundState.PreferencesController.openSeaEnabled ??
      true;

    delete typedState.engine.backgroundState.PreferencesController.openSeaEnabled;
  }
  if (typedState?.user?.nftDetectionDismissed) {
    delete typedState.user.nftDetectionDismissed;
  }

  return typedState;
}
