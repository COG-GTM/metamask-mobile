interface State {
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

export default function migrate(state: State): State {
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
