import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) return state;
  if (!isObject(state.engine)) return state;
  if (!isObject(state.engine.backgroundState)) return state;

  const tokensController = state.engine.backgroundState
    .TokensController as Record<string, unknown> | undefined;
  if (isObject(tokensController) && tokensController.suggestedAssets) {
    delete tokensController.suggestedAssets;
  }
  return state;
}
