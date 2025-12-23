interface State {
  recents?: unknown;
  [key: string]: unknown;
}

export default function migrate(state: State): State {
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
