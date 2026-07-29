/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
 */
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

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  const preferencesControllerState =
    typedState?.engine?.backgroundState?.PreferencesController;
  if (preferencesControllerState?.openSeaEnabled) {
    preferencesControllerState.displayNftMedia =
      preferencesControllerState.openSeaEnabled ?? true;

    delete preferencesControllerState.openSeaEnabled;
  }
  if (typedState?.user?.nftDetectionDismissed) {
    delete typedState.user.nftDetectionDismissed;
  }

  return state as Record<string, unknown>;
}
