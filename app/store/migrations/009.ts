interface Migration009State {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration009State;
  migratedState.engine.backgroundState.PreferencesController = {
    ...migratedState.engine.backgroundState.PreferencesController,
    useStaticTokenList: true,
  };
  return migratedState;
}
