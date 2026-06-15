interface Migration22State {
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        openSeaEnabled?: unknown;
        displayNftMedia?: unknown;
      };
    };
  };
  user?: {
    nftDetectionDismissed?: unknown;
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration22State;
  if (typedState?.engine?.backgroundState?.PreferencesController?.openSeaEnabled) {
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
