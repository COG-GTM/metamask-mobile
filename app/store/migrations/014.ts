export default function migrate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
) {
  if (state.engine.backgroundState.NetworkController.provider) {
    state.engine.backgroundState.NetworkController.providerConfig =
      state.engine.backgroundState.NetworkController.provider;
    delete state.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
