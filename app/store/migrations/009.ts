interface Migration9State {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration9State;
  typedState.engine.backgroundState.PreferencesController = {
    ...typedState.engine.backgroundState.PreferencesController,
    useStaticTokenList: true,
  };
  return typedState;
}
