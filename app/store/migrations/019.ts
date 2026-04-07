export default function migrate(state: unknown) {
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
