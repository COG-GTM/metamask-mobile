interface MigrationState {
  recents?: unknown;
  [key: string]: unknown;
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  if (s.recents) {
    delete s.recents;
  }
  return state;
}
