export default function migrate(state: unknown): unknown {
  const s = state as {
    engine: { backgroundState: { TokensController: Record<string, unknown> } };
  };
  if (s.engine.backgroundState.TokensController.suggestedAssets) {
    delete s.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
