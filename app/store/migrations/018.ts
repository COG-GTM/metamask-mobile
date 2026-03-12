// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export default function migrate(state) {
  if (state.engine.backgroundState.TokensController.suggestedAssets) {
    delete state.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
