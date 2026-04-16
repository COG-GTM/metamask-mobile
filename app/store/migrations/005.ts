import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 005: Invalid root state: '${typeof state}'`),
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
      new Error(`Migration 005: Invalid engine or backgroundState`),
    );
    return state;
  }

  const backgroundState = (state.engine as Record<string, unknown>)
    .backgroundState as Record<string, unknown>;

  if (!isObject(backgroundState.AssetsController)) {
    captureException(
      new Error(`Migration 005: Invalid AssetsController state`),
    );
    return state;
  }

  const assetsController = backgroundState.AssetsController as Record<
    string,
    unknown
  >;

  backgroundState.TokensController = {
    allTokens: assetsController.allTokens,
    ignoredTokens: assetsController.ignoredTokens,
  };

  backgroundState.CollectiblesController = {
    allCollectibles: assetsController.allCollectibles,
    allCollectibleContracts: assetsController.allCollectibleContracts,
    ignoredCollectibles: assetsController.ignoredCollectibles,
  };

  delete backgroundState.AssetsController;

  return state;
}
