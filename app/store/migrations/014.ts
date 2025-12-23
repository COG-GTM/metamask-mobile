interface State {
  engine: {
    backgroundState: {
      NetworkController: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider?: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        providerConfig?: any;
      };
    };
  };
}

export default function migrate(state: State): State {
  if (state.engine.backgroundState.NetworkController.provider) {
    state.engine.backgroundState.NetworkController.providerConfig =
      state.engine.backgroundState.NetworkController.provider;
    delete state.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
