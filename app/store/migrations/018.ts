export default function migrate(untypedState: unknown) {
  const state = untypedState as {
    engine: { backgroundState: Record<string, Record<string, unknown>> };
  };
  if (state.engine.backgroundState.TokensController.suggestedAssets) {
    delete state.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
