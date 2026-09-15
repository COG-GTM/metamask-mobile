interface LegacyState {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useCollectibleDetection: false,
    openSeaEnabled: false,
  };
  return state;
}
