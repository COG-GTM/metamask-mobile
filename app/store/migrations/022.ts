interface LegacyState {
  engine?: {
    backgroundState?: {
      PreferencesController?: {
        openSeaEnabled?: boolean;
        displayNftMedia?: boolean;
        [key: string]: unknown;
      };
    };
  };
  user?: {
    nftDetectionDismissed?: unknown;
    [key: string]: unknown;
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  const preferencesController =
    state?.engine?.backgroundState?.PreferencesController;
  if (preferencesController?.openSeaEnabled) {
    preferencesController.displayNftMedia =
      preferencesController.openSeaEnabled ?? true;

    delete preferencesController.openSeaEnabled;
  }
  if (state?.user?.nftDetectionDismissed) {
    delete state.user.nftDetectionDismissed;
  }

  return state;
}
