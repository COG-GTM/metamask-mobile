// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: Record<string, any>): Record<string, any> {
  if (state.engine.backgroundState.NetworkController.properties) {
    state.engine.backgroundState.NetworkController.networkDetails =
      state.engine.backgroundState.NetworkController.properties;
    delete state.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
