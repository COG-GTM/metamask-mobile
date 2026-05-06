import { isObject, hasProperty } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const tokensController = state.engine.backgroundState.TokensController;
  if (
    isObject(tokensController) &&
    hasProperty(tokensController, 'suggestedAssets')
  ) {
    delete tokensController.suggestedAssets;
  }
  return state;
}
