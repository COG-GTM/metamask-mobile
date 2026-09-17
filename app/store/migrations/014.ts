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
  const networkController = typedState.engine.backgroundState.NetworkController;
  if (networkController.provider) {
    networkController.providerConfig = networkController.provider;
    delete networkController.provider;
  }

  return typedState;
}
