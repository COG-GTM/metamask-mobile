export default function migrate(state: unknown): Record<string, unknown> {
  const networkControllerState = (
    state as {
      engine: {
        backgroundState: {
          NetworkController: {
            provider?: unknown;
            providerConfig?: unknown;
          };
        };
      };
    }
  ).engine.backgroundState.NetworkController;

  if (networkControllerState.provider) {
    networkControllerState.providerConfig = networkControllerState.provider;
    delete networkControllerState.provider;
  }

  return state as Record<string, unknown>;
}
