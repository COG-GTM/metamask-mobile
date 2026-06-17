interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController: Record<string, unknown>;
    };
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  typedState.engine.backgroundState.PreferencesController = {
    ...typedState.engine.backgroundState.PreferencesController,
    useCollectibleDetection: false,
    openSeaEnabled: false,
  };
  return typedState as unknown as Record<string, unknown>;
}
