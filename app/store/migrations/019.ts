export default function migrate(state: unknown) {
  const migratedState = state as { recents?: unknown };
  if (migratedState.recents) {
    delete migratedState.recents;
  }
  return migratedState;
}
