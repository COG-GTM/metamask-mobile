interface Migration19State {
  recents?: unknown;
}

export default function migrate(state: unknown) {
  const typedState = state as Migration19State;
  if (typedState.recents) {
    delete typedState.recents;
  }
  return typedState;
}
