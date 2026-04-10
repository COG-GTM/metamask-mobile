export default function migrate(state: unknown) {
  const typedState = state as {
    engine: {
      backgroundState: {
        TokensController: Record<string, unknown>;
      };
    };
  };
  if (typedState.engine.backgroundState.TokensController.suggestedAssets) {
    delete typedState.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
