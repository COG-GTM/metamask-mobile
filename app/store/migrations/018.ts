interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        suggestedAssets?: unknown;
        [key: string]: unknown;
      };
    };
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  if (typedState.engine.backgroundState.TokensController.suggestedAssets) {
    delete typedState.engine.backgroundState.TokensController.suggestedAssets;
  }
  return typedState as unknown as Record<string, unknown>;
}
