import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 18: Invalid root state: '${typeof state}'`),
    );
    return state;
  }
  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 18: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 18: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState.TokensController)) {
    captureException(
      new Error(
        `Migration 18: Invalid TokensController state: '${typeof state.engine
          .backgroundState.TokensController}'`,
      ),
    );
    return state;
  }

  const tokensController = state.engine.backgroundState
    .TokensController as Record<string, unknown>;
  if (tokensController.suggestedAssets) {
    delete tokensController.suggestedAssets;
  }
  return state;
}
