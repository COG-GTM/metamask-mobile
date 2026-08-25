interface AssetsControllerLegacyState {
  allTokens: unknown;
  ignoredTokens: unknown;
  allCollectibles: unknown;
  allCollectibleContracts: unknown;
  ignoredCollectibles: unknown;
}

interface Migration005State {
  engine: {
    backgroundState: {
      AssetsController?: AssetsControllerLegacyState;
      TokensController: unknown;
      CollectiblesController: unknown;
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration005State;
  const assetsController = state.engine.backgroundState
    .AssetsController as AssetsControllerLegacyState;

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
