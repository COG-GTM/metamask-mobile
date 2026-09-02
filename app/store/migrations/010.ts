interface Migration010State {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration010State;
  migratedState.engine.backgroundState.PreferencesController = {
    ...migratedState.engine.backgroundState.PreferencesController,
    useCollectibleDetection: false,
    openSeaEnabled: false,
  };
  return migratedState;
}
