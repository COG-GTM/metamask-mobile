export default function migrate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
) {
  if (state.engine.backgroundState.NetworkController.properties) {
    state.engine.backgroundState.NetworkController.networkDetails =
      state.engine.backgroundState.NetworkController.properties;
    delete state.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
