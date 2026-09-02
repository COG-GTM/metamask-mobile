interface Migration019State {
  recents?: unknown;
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration019State;
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
