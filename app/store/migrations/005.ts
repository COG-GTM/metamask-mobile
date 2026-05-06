import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.AssetsController)
  ) {
    captureException(
      new Error(
        `Migration 5: Invalid state structure for AssetsController migration`,
      ),
    );
    return state;
  }

  const assetsController = state.engine.backgroundState.AssetsController as {
    allTokens: unknown;
    ignoredTokens: unknown;
    allCollectibles: unknown;
    allCollectibleContracts: unknown;
    ignoredCollectibles: unknown;
  };

  state.engine.backgroundState.TokensController = {
    allTokens: assetsController.allTokens,
    ignoredTokens: assetsController.ignoredTokens,
  };

  state.engine.backgroundState.CollectiblesController = {
    allCollectibles: assetsController.allCollectibles,
    allCollectibleContracts: assetsController.allCollectibleContracts,
    ignoredCollectibles: assetsController.ignoredCollectibles,
  };

  delete state.engine.backgroundState.AssetsController;

  return state;
}
