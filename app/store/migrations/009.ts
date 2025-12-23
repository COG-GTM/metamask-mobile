interface State {
  engine: {
    backgroundState: {
      PreferencesController: {
        useStaticTokenList?: boolean;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: State): State {
  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useStaticTokenList: true,
  };
  return state;
}
