interface Migration16State {
  engine: {
    backgroundState: {
      NetworkController: {
        properties?: unknown;
        networkDetails?: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration16State;
  if (typedState.engine.backgroundState.NetworkController.properties) {
    typedState.engine.backgroundState.NetworkController.networkDetails =
      typedState.engine.backgroundState.NetworkController.properties;
    delete typedState.engine.backgroundState.NetworkController.properties;
  }
  return typedState;
}
