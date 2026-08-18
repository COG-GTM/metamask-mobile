interface MigrationState {
  recents?: unknown;
  [key: string]: unknown;
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  if (typedState.recents) {
    delete typedState.recents;
  }
  return typedState;
}
