interface Migration018State {
  engine: {
    backgroundState: {
      TokensController: {
        suggestedAssets?: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration018State;
  if (migratedState.engine.backgroundState.TokensController.suggestedAssets) {
    delete migratedState.engine.backgroundState.TokensController
      .suggestedAssets;
  }
  return migratedState;
}
