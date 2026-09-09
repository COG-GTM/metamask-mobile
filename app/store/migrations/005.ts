interface MigrationState {
  engine: {
    backgroundState: {
      AssetsController?: Record<string, unknown>;
      TokensController: Record<string, unknown>;
      CollectiblesController?: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as MigrationState;
  const assetsController = typedState.engine.backgroundState
    .AssetsController as Record<string, unknown>;
  typedState.engine.backgroundState.TokensController = {
    allTokens: assetsController.allTokens,
    ignoredTokens: assetsController.ignoredTokens,
  };

  typedState.engine.backgroundState.CollectiblesController = {
    allCollectibles:
    assetsController.allCollectibles,
    allCollectibleContracts:
      assetsController.allCollectibleContracts,
    ignoredCollectibles:
      assetsController.ignoredCollectibles,
  };

  delete typedState.engine.backgroundState.AssetsController;

  return typedState;
}
