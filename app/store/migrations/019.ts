export default function migrate(untypedState: unknown) {
  const state = untypedState as { recents?: unknown };
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
