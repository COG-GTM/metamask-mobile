// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  if (state.engine.backgroundState.TokensController.suggestedAssets) {
    delete state.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
