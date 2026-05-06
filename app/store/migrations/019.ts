interface State019 {
  recents?: unknown;
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State019;
  if (typedState.recents) {
    delete typedState.recents;
  }
  return state;
}
