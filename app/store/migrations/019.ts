export default function migrate(state: unknown) {
  const typedState = state as Record<string, unknown>;
  if (typedState.recents) {
    delete typedState.recents;
  }
  return state;
}
