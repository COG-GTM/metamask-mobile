interface MigrationState {
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        openSeaEnabled?: boolean;
        displayNftMedia?: boolean;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  };
  user?: {
    nftDetectionDismissed?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export default function migrate(stateUnknown: unknown) {
  const state = stateUnknown as MigrationState;
  const preferencesControllerState =
    state?.engine?.backgroundState?.PreferencesController;
  if (preferencesControllerState?.openSeaEnabled) {
    preferencesControllerState.displayNftMedia =
      preferencesControllerState.openSeaEnabled ?? true;

    delete preferencesControllerState.openSeaEnabled;
  }
  if (state?.user?.nftDetectionDismissed) {
    delete state.user.nftDetectionDismissed;
  }

  return state;
}
