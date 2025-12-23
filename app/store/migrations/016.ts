interface State {
  engine: {
    backgroundState: {
      NetworkController: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        properties?: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        networkDetails?: any;
      };
    };
  };
}

export default function migrate(state: State): State {
  if (state.engine.backgroundState.NetworkController.properties) {
    state.engine.backgroundState.NetworkController.networkDetails =
      state.engine.backgroundState.NetworkController.properties;
    delete state.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
