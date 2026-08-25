/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  networkOnboarded?: {
    networkOnboardedState?: Record<string, unknown>;
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  if (migratedState.networkOnboarded?.networkOnboardedState) {
    migratedState.networkOnboarded.networkOnboardedState = {};
  }
  return migratedState;
}
