interface LegacyState {
  engine: {
    backgroundState: {
      NetworkController: {
        properties?: unknown;
        networkDetails?: unknown;
      };
    };
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  if (state.engine.backgroundState.NetworkController.properties) {
    state.engine.backgroundState.NetworkController.networkDetails =
      state.engine.backgroundState.NetworkController.properties;
    delete state.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
