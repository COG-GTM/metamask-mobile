// Legacy persisted state shape expected by this migration
interface StateWithRecents {
  recents?: unknown;
}

export default function migrate(state: unknown) {
  const typedState = state as StateWithRecents;
  if (typedState.recents) {
    delete typedState.recents;
  }
  return typedState;
}
