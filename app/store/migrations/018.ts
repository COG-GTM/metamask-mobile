interface Migration18State {
  engine: {
    backgroundState: {
      TokensController: {
        suggestedAssets?: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration18State;
  if (typedState.engine.backgroundState.TokensController.suggestedAssets) {
    delete typedState.engine.backgroundState.TokensController.suggestedAssets;
  }
  return typedState;
}
