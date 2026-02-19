interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        suggestedAssets?: unknown;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  if (s.engine.backgroundState.TokensController.suggestedAssets) {
    delete s.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
