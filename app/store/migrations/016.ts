interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        properties?: Record<string, unknown>;
        networkDetails?: Record<string, unknown>;
      };
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as MigrationState;
  if (state.engine.backgroundState.NetworkController.properties) {
    state.engine.backgroundState.NetworkController.networkDetails =
      state.engine.backgroundState.NetworkController.properties;
    delete state.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
