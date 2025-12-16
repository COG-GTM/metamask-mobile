import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  const engineState = state.engine as Record<string, Record<string, unknown>> | undefined;
  if (!engineState?.backgroundState) {
    return state;
  }

  const tokensController = engineState.backgroundState.TokensController as Record<string, unknown> | undefined;
  if (tokensController?.suggestedAssets) {
    delete tokensController.suggestedAssets;
  }

  return state;
}
