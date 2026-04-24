export default function migrate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
) {
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
