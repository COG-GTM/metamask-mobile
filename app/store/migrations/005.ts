type TokenMap = Record<string, unknown>;

interface MigrationState {
  engine: {
    backgroundState: {
      AssetsController?: AssetsControllerState;
      TokensController: {
        allTokens: TokenMap;
        ignoredTokens: unknown[];
      };
      CollectiblesController: {
        allCollectibles: TokenMap;
        allCollectibleContracts: TokenMap;
        ignoredCollectibles: unknown[];
      };
    };
  };
}

interface AssetsControllerState {
  allTokens: TokenMap;
  ignoredTokens: unknown[];
  allCollectibles: TokenMap;
  allCollectibleContracts: TokenMap;
  ignoredCollectibles: unknown[];
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
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
