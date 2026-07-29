interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        suggestedAssets?: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  if (migrationState.engine.backgroundState.TokensController.suggestedAssets) {
    delete migrationState.engine.backgroundState.TokensController
      .suggestedAssets;
  }
  return state;
}
