import { isObject, hasProperty } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const tokensControllerState = state.engine.backgroundState.TokensController;
  if (!isObject(tokensControllerState)) {
    return state;
  }

  if (hasProperty(tokensControllerState, 'suggestedAssets')) {
    delete tokensControllerState.suggestedAssets;
  }
  return state;
}
