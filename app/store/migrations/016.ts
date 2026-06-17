interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        properties?: unknown;
        networkDetails?: unknown;
        [key: string]: unknown;
      };
    };
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  if (typedState.engine.backgroundState.NetworkController.properties) {
    typedState.engine.backgroundState.NetworkController.networkDetails =
      typedState.engine.backgroundState.NetworkController.properties;
    delete typedState.engine.backgroundState.NetworkController.properties;
  }
  return typedState as unknown as Record<string, unknown>;
}
