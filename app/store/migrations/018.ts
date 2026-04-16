import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 018: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (
    !isObject(state.engine) ||
    !isObject(
      (state.engine as Record<string, unknown>).backgroundState,
    )
  ) {
    captureException(
      new Error(`Migration 018: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  if (!isObject(backgroundState.TokensController)) {
    captureException(
      new Error(`Migration 018: Invalid TokensController state`),
    );
    return state;
  }

  const tokensController = backgroundState.TokensController as Record<
    string,
    unknown
  >;

  if (tokensController.suggestedAssets) {
    delete tokensController.suggestedAssets;
  }
  return state;
}
