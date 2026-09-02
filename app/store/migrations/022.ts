/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  user?: {
    nftDetectionDismissed?: boolean;
    [key: string]: unknown;
  };
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        openSeaEnabled?: boolean;
        displayNftMedia?: boolean;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const preferencesController =
    migratedState?.engine?.backgroundState?.PreferencesController;
  if (preferencesController?.openSeaEnabled) {
    preferencesController.displayNftMedia =
      preferencesController.openSeaEnabled ?? true;

    delete preferencesController.openSeaEnabled;
  }
  if (migratedState?.user?.nftDetectionDismissed) {
    delete migratedState.user.nftDetectionDismissed;
  }

  return migratedState;
}
