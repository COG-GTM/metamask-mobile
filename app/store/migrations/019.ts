export default function migrate(state: unknown): unknown {
  const s = state as Record<string, unknown>;
  if (s.recents) {
    delete s.recents;
  }
  return state;
}
