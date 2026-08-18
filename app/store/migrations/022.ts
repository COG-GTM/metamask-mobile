interface PreferencesControllerState {
  openSeaEnabled?: boolean;
  displayNftMedia?: boolean;
}

interface MigrationState {
  user?: {
    nftDetectionDismissed?: boolean;
  };
  engine?: {
    backgroundState?: {
      PreferencesController?: PreferencesControllerState;
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  if (
    typedState?.engine?.backgroundState?.PreferencesController?.openSeaEnabled
  ) {
    typedState.engine.backgroundState.PreferencesController.displayNftMedia =
      typedState.engine.backgroundState.PreferencesController.openSeaEnabled ??
      true;

    delete typedState.engine.backgroundState.PreferencesController
      .openSeaEnabled;
  }
  if (typedState?.user?.nftDetectionDismissed) {
    delete typedState.user.nftDetectionDismissed;
  }

  return typedState;
}
