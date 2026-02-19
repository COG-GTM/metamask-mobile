interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  s.engine.backgroundState.PreferencesController = {
    ...s.engine.backgroundState.PreferencesController,
    useStaticTokenList: true,
  };
  return state;
}
