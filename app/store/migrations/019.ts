interface MigrationState {
  recents?: unknown;
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as MigrationState;
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
