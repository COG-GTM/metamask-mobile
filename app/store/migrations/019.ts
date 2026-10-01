export default function migrate(state: Record<string, unknown>) {
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
