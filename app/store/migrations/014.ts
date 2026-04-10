export default function migrate(state: unknown) {
  const typedState = state as {
    engine: {
      backgroundState: {
        NetworkController: Record<string, unknown>;
      };
    };
  };
  if (typedState.engine.backgroundState.NetworkController.provider) {
    typedState.engine.backgroundState.NetworkController.providerConfig =
      typedState.engine.backgroundState.NetworkController.provider;
    delete typedState.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
