export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        NetworkController: {
          properties?: unknown;
          networkDetails?: unknown;
        };
      };
    };
  };
  const networkController = typedState.engine.backgroundState.NetworkController;
  if (networkController.properties) {
    networkController.networkDetails = networkController.properties;
    delete networkController.properties;
  }
  return typedState;
}
