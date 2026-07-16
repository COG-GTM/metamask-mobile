import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 18)) {
    return state;
  }

  const tokensController = state.engine.backgroundState.TokensController;
  if (!isObject(tokensController)) {
    return state;
  }

  if (tokensController.suggestedAssets) {
    delete tokensController.suggestedAssets;
  }
  return state;
}
