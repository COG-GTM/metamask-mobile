interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  migrationState.engine.backgroundState.PreferencesController = {
    ...migrationState.engine.backgroundState.PreferencesController,
    useCollectibleDetection: false,
    openSeaEnabled: false,
  };
  return state;
}
