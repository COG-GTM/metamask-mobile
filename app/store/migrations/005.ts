import { isObject, hasProperty } from '@metamask/utils';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const assetsController = state.engine.backgroundState.AssetsController;
  if (!isObject(assetsController)) {
    return state;
  }

  state.engine.backgroundState.TokensController = {
    allTokens: hasProperty(assetsController, 'allTokens')
      ? assetsController.allTokens
      : undefined,
    ignoredTokens: hasProperty(assetsController, 'ignoredTokens')
      ? assetsController.ignoredTokens
      : undefined,
  };

  state.engine.backgroundState.CollectiblesController = {
    allCollectibles: hasProperty(assetsController, 'allCollectibles')
      ? assetsController.allCollectibles
      : undefined,
    allCollectibleContracts: hasProperty(
      assetsController,
      'allCollectibleContracts',
    )
      ? assetsController.allCollectibleContracts
      : undefined,
    ignoredCollectibles: hasProperty(assetsController, 'ignoredCollectibles')
      ? assetsController.ignoredCollectibles
      : undefined,
  };

  delete state.engine.backgroundState.AssetsController;

  return state;
}
