import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.TokensController)
  ) {
    captureException(
      new Error(
        `Migration 18: Invalid state structure for TokensController migration`,
      ),
    );
    return state;
  }

  const tokensController = state.engine.backgroundState
    .TokensController as { suggestedAssets?: unknown };
  if (tokensController.suggestedAssets) {
    delete tokensController.suggestedAssets;
  }
  return state;
}
