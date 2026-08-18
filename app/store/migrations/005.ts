type TokenMap = Record<string, unknown>;

interface MigrationState {
  engine: {
    backgroundState: {
      AssetsController: {
        allTokens: TokenMap;
        ignoredTokens: unknown[];
        allCollectibles: TokenMap;
        allCollectibleContracts: TokenMap;
        ignoredCollectibles: unknown[];
      };
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

export default function migrate(state: unknown) {
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

  // @ts-expect-error AssetsController is removed by this migration.
  delete typedState.engine.backgroundState.AssetsController;

  return typedState;
}
