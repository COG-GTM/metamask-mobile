interface AssetsControllerState {
  allTokens: unknown;
  ignoredTokens: unknown;
  allCollectibles: unknown;
  allCollectibleContracts: unknown;
  ignoredCollectibles: unknown;
}

// Legacy persisted state shape expected by this migration
interface StateWithAssetsController {
  engine: {
    backgroundState: {
      AssetsController?: AssetsControllerState;
      TokensController: unknown;
      CollectiblesController: unknown;
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as StateWithAssetsController;
  const assetsController = typedState.engine.backgroundState
    .AssetsController as AssetsControllerState;
  typedState.engine.backgroundState.TokensController = {
    allTokens: assetsController.allTokens,
    ignoredTokens: assetsController.ignoredTokens,
  };

  typedState.engine.backgroundState.CollectiblesController = {
    allCollectibles: assetsController.allCollectibles,
    allCollectibleContracts: assetsController.allCollectibleContracts,
    ignoredCollectibles: assetsController.ignoredCollectibles,
  };

  delete typedState.engine.backgroundState.AssetsController;

  return typedState;
}
