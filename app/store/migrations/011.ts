interface Migration011State {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration011State;
  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useTokenDetection: true,
  };
  return state;
}
