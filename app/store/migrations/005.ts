interface MigrationState {
  engine: {
    backgroundState: {
      AssetsController: {
        allTokens: unknown;
        ignoredTokens: unknown;
        allCollectibles: unknown;
        allCollectibleContracts: unknown;
        ignoredCollectibles: unknown;
        [key: string]: unknown;
      };
      TokensController?: unknown;
      CollectiblesController?: unknown;
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  typedState.engine.backgroundState.TokensController = {
    allTokens: typedState.engine.backgroundState.AssetsController.allTokens,
    ignoredTokens:
      typedState.engine.backgroundState.AssetsController.ignoredTokens,
  };

  typedState.engine.backgroundState.CollectiblesController = {
    allCollectibles:
      typedState.engine.backgroundState.AssetsController.allCollectibles,
    allCollectibleContracts:
      typedState.engine.backgroundState.AssetsController.allCollectibleContracts,
    ignoredCollectibles:
      typedState.engine.backgroundState.AssetsController.ignoredCollectibles,
  };

  delete (typedState.engine.backgroundState as Record<string, unknown>)
    .AssetsController;

  return typedState as unknown as Record<string, unknown>;
}
