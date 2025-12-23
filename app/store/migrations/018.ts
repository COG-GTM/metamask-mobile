interface State {
  engine: {
    backgroundState: {
      TokensController: {
        suggestedAssets?: unknown;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: State): State {
  if (state.engine.backgroundState.TokensController.suggestedAssets) {
    delete state.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
