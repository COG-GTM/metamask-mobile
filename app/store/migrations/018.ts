export default function migrate(state: unknown): Record<string, unknown> {
  const tokensControllerState = (
    state as {
      engine: {
        backgroundState: {
          TokensController: {
            suggestedAssets?: unknown;
          };
        };
      };
    }
  ).engine.backgroundState.TokensController;

  if (tokensControllerState.suggestedAssets) {
    delete tokensControllerState.suggestedAssets;
  }
  return state as Record<string, unknown>;
}
