import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 5)) {
    return state;
  }

  const assetsController = state.engine.backgroundState.AssetsController;
  if (!isObject(assetsController)) {
    return state;
  }

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
