interface MigrationState {
  recents?: unknown;
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  if (migrationState.recents) {
    delete migrationState.recents;
  }
  return state;
}
