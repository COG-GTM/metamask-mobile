interface LegacyState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider?: unknown;
        providerConfig?: unknown;
      };
    };
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  if (state.engine.backgroundState.NetworkController.provider) {
    state.engine.backgroundState.NetworkController.providerConfig =
      state.engine.backgroundState.NetworkController.provider;
    delete state.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
