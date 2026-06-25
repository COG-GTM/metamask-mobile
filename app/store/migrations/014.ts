export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        NetworkController: {
          provider?: unknown;
          providerConfig?: unknown;
        };
      };
    };
  };
  if (typedState.engine.backgroundState.NetworkController.provider) {
    typedState.engine.backgroundState.NetworkController.providerConfig =
      typedState.engine.backgroundState.NetworkController.provider;
    delete typedState.engine.backgroundState.NetworkController.provider;
  }

  return typedState;
}
