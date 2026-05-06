interface State016 {
  engine: {
    backgroundState: {
      NetworkController: {
        properties?: unknown;
        networkDetails?: unknown;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State016;
  if (typedState.engine.backgroundState.NetworkController.properties) {
    typedState.engine.backgroundState.NetworkController.networkDetails =
      typedState.engine.backgroundState.NetworkController.properties;
    delete typedState.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
