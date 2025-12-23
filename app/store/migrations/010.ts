interface State {
  engine: {
    backgroundState: {
      PreferencesController: {
        useCollectibleDetection?: boolean;
        openSeaEnabled?: boolean;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: State): State {
  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useCollectibleDetection: false,
    openSeaEnabled: false,
  };
  return state;
}
