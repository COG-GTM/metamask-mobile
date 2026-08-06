import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 18)) {
    return state;
  }

  const tokensControllerState = state.engine.backgroundState.TokensController;

  if (
    isObject(tokensControllerState) &&
    tokensControllerState.suggestedAssets
  ) {
    delete tokensControllerState.suggestedAssets;
  }
  return state;
}
