interface State009 {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State009;
  typedState.engine.backgroundState.PreferencesController = {
    ...typedState.engine.backgroundState.PreferencesController,
    useStaticTokenList: true,
  };
  return state;
}
