import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Remove suggested token assets.
 * @param {unknown} state - Redux state.
 * @returns Migrated Redux state.
 */
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
        `Migration 18: Invalid root engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 18: Invalid root engine backgroundState: '${typeof state
          .engine.backgroundState}'`,
      ),
    );
    return state;
  }
  const { backgroundState } = state.engine;
  if (!isObject(backgroundState.TokensController)) {
    captureException(
      new Error(
        `Migration 18: Invalid TokensController state: '${typeof backgroundState.TokensController}'`,
      ),
    );
    return state;
  }
  const tokensController = backgroundState.TokensController;
  if (tokensController.suggestedAssets) {
    delete tokensController.suggestedAssets;
  }
  return state;
}
