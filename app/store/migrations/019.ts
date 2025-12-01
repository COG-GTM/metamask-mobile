// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
