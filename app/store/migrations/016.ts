export default function migrate(state: unknown): Record<string, unknown> {
  const networkControllerState = (
    state as {
      engine: {
        backgroundState: {
          NetworkController: {
            properties?: unknown;
            networkDetails?: unknown;
          };
        };
      };
    }
  ).engine.backgroundState.NetworkController;

  if (networkControllerState.properties) {
    networkControllerState.networkDetails = networkControllerState.properties;
    delete networkControllerState.properties;
  }
  return state as Record<string, unknown>;
}
