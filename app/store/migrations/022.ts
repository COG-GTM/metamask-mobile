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
    nftDetectionDismissed?: boolean;
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as MigrationState;
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
