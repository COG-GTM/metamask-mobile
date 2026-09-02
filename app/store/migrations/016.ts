/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        properties?: Record<string, unknown>;
        networkDetails?: Record<string, unknown>;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  if (migratedState.engine.backgroundState.NetworkController.properties) {
    migratedState.engine.backgroundState.NetworkController.networkDetails =
      migratedState.engine.backgroundState.NetworkController.properties;
    delete migratedState.engine.backgroundState.NetworkController.properties;
  }
  return migratedState;
}
