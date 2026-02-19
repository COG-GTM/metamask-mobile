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
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  if (s.engine.backgroundState.NetworkController.properties) {
    s.engine.backgroundState.NetworkController.networkDetails =
      s.engine.backgroundState.NetworkController.properties;
    delete s.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
