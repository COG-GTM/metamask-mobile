interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  migratedState.engine.backgroundState.PreferencesController = {
    ...migratedState.engine.backgroundState.PreferencesController,
    useStaticTokenList: true,
  };
  return migratedState;
}
