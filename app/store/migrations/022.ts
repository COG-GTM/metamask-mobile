interface State022 {
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

export default function migrate(state: unknown): unknown {
  const typedState = state as State022;
  const preferencesController =
    typedState?.engine?.backgroundState?.PreferencesController;
  if (preferencesController?.openSeaEnabled) {
    preferencesController.displayNftMedia =
      preferencesController.openSeaEnabled ?? true;

    delete preferencesController.openSeaEnabled;
  }
  if (typedState?.user?.nftDetectionDismissed) {
    delete typedState.user.nftDetectionDismissed;
  }

  return state;
}
