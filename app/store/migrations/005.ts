import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 5)) {
    return state;
  }

  const assetsControllerState = state.engine.backgroundState.AssetsController;
  if (!isObject(assetsControllerState)) {
    captureException(
      new Error(
        `Migration 5: Invalid AssetsController state: '${typeof assetsControllerState}'`,
      ),
    );
    return state;
  }

  state.engine.backgroundState.TokensController = {
    allTokens: assetsControllerState.allTokens,
    ignoredTokens: assetsControllerState.ignoredTokens,
  };

  state.engine.backgroundState.CollectiblesController = {
    allCollectibles: assetsControllerState.allCollectibles,
    allCollectibleContracts: assetsControllerState.allCollectibleContracts,
    ignoredCollectibles: assetsControllerState.ignoredCollectibles,
  };

  delete state.engine.backgroundState.AssetsController;

  return state;
}
