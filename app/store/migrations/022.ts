interface Migration22State {
  user?: {
    nftDetectionDismissed?: boolean;
  };
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        openSeaEnabled?: boolean;
        displayNftMedia?: boolean;
      };
    };
  };
}

export default function migrate(rawState: unknown) {
  const state = rawState as Migration22State;
  if (state?.engine?.backgroundState?.PreferencesController?.openSeaEnabled) {
    state.engine.backgroundState.PreferencesController.displayNftMedia =
      state.engine.backgroundState.PreferencesController.openSeaEnabled ?? true;

    delete state.engine.backgroundState.PreferencesController.openSeaEnabled;
  }
  if (state?.user?.nftDetectionDismissed) {
    delete state.user.nftDetectionDismissed;
  }

  return state;
}
