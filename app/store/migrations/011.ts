interface State011 {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State011;
  typedState.engine.backgroundState.PreferencesController = {
    ...typedState.engine.backgroundState.PreferencesController,
    useTokenDetection: true,
  };
  return state;
}
