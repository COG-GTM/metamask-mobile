interface LegacyState {
  recents?: unknown;
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
