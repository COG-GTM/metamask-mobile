interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        suggestedAssets?: unknown;
      };
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as MigrationState;
  if (state.engine.backgroundState.TokensController.suggestedAssets) {
    delete state.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
