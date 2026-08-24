interface Migration019State {
  recents?: unknown;
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration019State;
  if (migratedState.recents) {
    delete migratedState.recents;
  }
  return migratedState;
}
