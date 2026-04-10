export default function migrate(state: unknown) {
  const typedState = state as {
    engine: {
      backgroundState: {
        NetworkController: Record<string, unknown>;
      };
    };
  };
  if (typedState.engine.backgroundState.NetworkController.properties) {
    typedState.engine.backgroundState.NetworkController.networkDetails =
      typedState.engine.backgroundState.NetworkController.properties;
    delete typedState.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
