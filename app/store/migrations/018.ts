import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): Record<string, unknown> {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 018: Invalid root state: '${typeof state}'`),
    );
    return state as Record<string, unknown>;
  }

  if (
    !isObject(state.engine) ||
    !isObject((state.engine as Record<string, unknown>).backgroundState)
  ) {
    return state as Record<string, unknown>;
  }

  const engine = state.engine as Record<string, unknown>;
  const backgroundState = engine.backgroundState as Record<string, unknown>;

  if (!isObject(backgroundState.TokensController)) {
    return state as Record<string, unknown>;
  }

  const tokensController = backgroundState.TokensController as Record<string, unknown>;

  if (tokensController.suggestedAssets) {
    delete tokensController.suggestedAssets;
  }
  return state as Record<string, unknown>;
}
