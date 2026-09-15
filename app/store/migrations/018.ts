interface LegacyState {
  engine: {
    backgroundState: {
      TokensController: {
        suggestedAssets?: unknown;
      };
    };
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  if (state.engine.backgroundState.TokensController.suggestedAssets) {
    delete state.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
