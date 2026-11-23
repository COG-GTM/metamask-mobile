interface MigrationState {
  engine: {
    backgroundState: {
      AssetsController?: Record<string, unknown>;
      TokensController?: Record<string, unknown>;
      CollectiblesController?: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  const backgroundState = typedState.engine.backgroundState;
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

  return typedState;
}
