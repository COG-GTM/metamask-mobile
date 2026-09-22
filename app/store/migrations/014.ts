interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider?: Record<string, unknown>;
        providerConfig?: Record<string, unknown>;
      };
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as MigrationState;
  if (state.engine.backgroundState.NetworkController.provider) {
    state.engine.backgroundState.NetworkController.providerConfig =
      state.engine.backgroundState.NetworkController.provider;
    delete state.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
