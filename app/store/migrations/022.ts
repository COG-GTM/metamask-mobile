interface Migration022PreferencesController {
  openSeaEnabled?: boolean;
  displayNftMedia?: boolean;
  [key: string]: unknown;
}

interface Migration022State {
  engine?: {
    backgroundState?: {
      PreferencesController?: Migration022PreferencesController;
    };
  };
  user?: {
    nftDetectionDismissed?: boolean;
    [key: string]: unknown;
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration022State;
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
