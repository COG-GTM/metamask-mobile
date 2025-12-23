import { isObject } from '@metamask/utils';

export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const backgroundState = state.engine.backgroundState as Record<string, unknown>;
  const assetsController = backgroundState.AssetsController as Record<string, unknown> | undefined;

  backgroundState.TokensController = {
    allTokens: assetsController?.allTokens,
    ignoredTokens: assetsController?.ignoredTokens,
  };

  backgroundState.CollectiblesController = {
    allCollectibles: assetsController?.allCollectibles,
    allCollectibleContracts: assetsController?.allCollectibleContracts,
    ignoredCollectibles: assetsController?.ignoredCollectibles,
  };

  delete backgroundState.AssetsController;

  return state;
}
