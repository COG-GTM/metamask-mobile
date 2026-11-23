interface MigrationState {
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        openSeaEnabled?: boolean;
        displayNftMedia?: boolean;
      };
    };
  };
  user?: { nftDetectionDismissed?: boolean };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState | undefined;
  if (
    migratedState?.engine?.backgroundState?.PreferencesController
      ?.openSeaEnabled
  ) {
    migratedState.engine.backgroundState.PreferencesController.displayNftMedia =
      migratedState.engine.backgroundState.PreferencesController
        .openSeaEnabled ?? true;

    delete migratedState.engine.backgroundState.PreferencesController
      .openSeaEnabled;
  }
  if (migratedState?.user?.nftDetectionDismissed) {
    delete migratedState.user.nftDetectionDismissed;
  }

  return migratedState;
}
