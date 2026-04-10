export default function migrate(state: unknown) {
  const typedState = state as {
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
  };
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

  return state;
}
