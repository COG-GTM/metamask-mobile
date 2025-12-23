interface State {
  engine: {
    backgroundState: {
      PreferencesController: {
        useTokenDetection?: boolean;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: State): State {
  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useTokenDetection: true,
  };
  return state;
}
