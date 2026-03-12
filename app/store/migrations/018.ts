export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  if (s.engine.backgroundState.TokensController.suggestedAssets) {
    delete s.engine.backgroundState.TokensController.suggestedAssets;
  }
  return s;
}
