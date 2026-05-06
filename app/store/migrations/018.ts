interface State018 {
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
  const typedState = state as State018;
  if (typedState.engine.backgroundState.TokensController.suggestedAssets) {
    delete typedState.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
