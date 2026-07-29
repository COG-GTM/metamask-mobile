interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController: {
        openSeaEnabled?: boolean;
        displayNftMedia?: boolean;
      };
    };
  };
  user: {
    nftDetectionDismissed?: boolean;
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  if (
    migrationState?.engine?.backgroundState?.PreferencesController
      ?.openSeaEnabled
  ) {
    migrationState.engine.backgroundState.PreferencesController.displayNftMedia =
      migrationState.engine.backgroundState.PreferencesController
        .openSeaEnabled ?? true;

    delete migrationState.engine.backgroundState.PreferencesController
      .openSeaEnabled;
  }
  if (migrationState?.user?.nftDetectionDismissed) {
    delete migrationState.user.nftDetectionDismissed;
  }

  return state;
}
