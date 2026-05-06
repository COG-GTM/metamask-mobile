interface State014 {
  engine: {
    backgroundState: {
      NetworkController: {
        provider?: unknown;
        providerConfig?: unknown;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State014;
  if (typedState.engine.backgroundState.NetworkController.provider) {
    typedState.engine.backgroundState.NetworkController.providerConfig =
      typedState.engine.backgroundState.NetworkController.provider;
    delete typedState.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
