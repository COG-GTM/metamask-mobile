interface Migration14State {
  engine: {
    backgroundState: {
      NetworkController: {
        provider?: Record<string, unknown>;
        providerConfig?: Record<string, unknown>;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration14State;
  if (typedState.engine.backgroundState.NetworkController.provider) {
    typedState.engine.backgroundState.NetworkController.providerConfig =
      typedState.engine.backgroundState.NetworkController.provider;
    delete typedState.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
