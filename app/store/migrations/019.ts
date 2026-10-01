export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as { recents?: unknown };
  if (typedState.recents) {
    delete typedState.recents;
  }
  return state as Record<string, unknown>;
}
