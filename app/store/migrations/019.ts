/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  recents?: unknown;
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  if (migratedState.recents) {
    delete migratedState.recents;
  }
  return migratedState;
}
