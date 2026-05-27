export default function migrate(state: Record<string, unknown>) {
  if (state.engine.backgroundState.NetworkController.provider) {
    state.engine.backgroundState.NetworkController.providerConfig =
      state.engine.backgroundState.NetworkController.provider;
    delete state.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
