export default function migrate(state) {
  const preferencesControllerState =
    state?.engine?.backgroundState?.PreferencesController;
  if (
    preferencesControllerState &&
    Object.prototype.hasOwnProperty.call(
      preferencesControllerState,
      'openSeaEnabled',
    )
  ) {
    preferencesControllerState.displayNftMedia =
      preferencesControllerState.openSeaEnabled ?? true;

    delete preferencesControllerState.openSeaEnabled;
  }
  if (state?.user?.nftDetectionDismissed) {
    delete state.user.nftDetectionDismissed;
  }

  return state;
}
