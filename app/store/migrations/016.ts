export default function migrate(untypedState: unknown) {
  const state = untypedState as {
    engine: { backgroundState: Record<string, Record<string, unknown>> };
  };
  if (state.engine.backgroundState.NetworkController.properties) {
    state.engine.backgroundState.NetworkController.networkDetails =
      state.engine.backgroundState.NetworkController.properties;
    delete state.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
