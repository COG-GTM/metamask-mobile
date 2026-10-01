export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        TokensController: {
          suggestedAssets?: unknown;
        } & Record<string, unknown>;
      };
    };
  };
  if (typedState.engine.backgroundState.TokensController.suggestedAssets) {
    delete typedState.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state as Record<string, unknown>;
}
