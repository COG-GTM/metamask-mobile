interface MigrationState {
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        openSeaEnabled?: boolean;
        displayNftMedia?: boolean;
        [key: string]: unknown;
      };
    };
  };
  user?: {
    nftDetectionDismissed?: unknown;
    [key: string]: unknown;
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
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
