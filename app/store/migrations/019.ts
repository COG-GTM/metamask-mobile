interface MigrationState {
  recents?: unknown;
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  if (typedState.recents) {
    delete typedState.recents;
  }
  return typedState as unknown as Record<string, unknown>;
}
