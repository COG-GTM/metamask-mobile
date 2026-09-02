/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider?: Record<string, unknown>;
        providerConfig?: Record<string, unknown>;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  if (migratedState.engine.backgroundState.NetworkController.provider) {
    migratedState.engine.backgroundState.NetworkController.providerConfig =
      migratedState.engine.backgroundState.NetworkController.provider;
    delete migratedState.engine.backgroundState.NetworkController.provider;
  }

  return migratedState;
}
