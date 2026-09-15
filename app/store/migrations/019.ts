interface MigrationState {
  recents?: unknown;
  [key: string]: unknown;
}

export default function migrate(stateUnknown: unknown) {
  const state = stateUnknown as MigrationState;
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
