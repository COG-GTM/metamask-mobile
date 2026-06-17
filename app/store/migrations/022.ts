interface PreferencesControllerState {
  openSeaEnabled?: unknown;
  displayNftMedia?: unknown;
  [key: string]: unknown;
}

interface MigrationState {
  engine?: {
    backgroundState?: {
      PreferencesController?: PreferencesControllerState;
      [key: string]: unknown;
    };
  };
  user?: {
    nftDetectionDismissed?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  const preferencesController =
    typedState?.engine?.backgroundState?.PreferencesController;
  if (preferencesController?.openSeaEnabled) {
    preferencesController.displayNftMedia =
      preferencesController.openSeaEnabled ?? true;

    delete preferencesController.openSeaEnabled;
  }
  const user = typedState?.user;
  if (user?.nftDetectionDismissed) {
    delete user.nftDetectionDismissed;
  }

  return typedState as unknown as Record<string, unknown>;
}
