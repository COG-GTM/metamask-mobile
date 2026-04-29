export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  if (engineState.backgroundState.TokensController.suggestedAssets) {
    delete engineState.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
