interface Migration11State {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration11State;
  typedState.engine.backgroundState.PreferencesController = {
    ...typedState.engine.backgroundState.PreferencesController,
    useTokenDetection: true,
  };
  return typedState;
}
