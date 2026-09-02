interface AssetsControllerState {
  allTokens: unknown;
  ignoredTokens: unknown;
  allCollectibles: unknown;
  allCollectibleContracts: unknown;
  ignoredCollectibles: unknown;
}

/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      AssetsController?: AssetsControllerState;
      TokensController?: Record<string, unknown>;
      CollectiblesController?: Record<string, unknown>;
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const assetsController = migratedState.engine.backgroundState
    .AssetsController as AssetsControllerState;

  migratedState.engine.backgroundState.TokensController = {
    allTokens: assetsController.allTokens,
    ignoredTokens: assetsController.ignoredTokens,
  };

  migratedState.engine.backgroundState.CollectiblesController = {
    allCollectibles: assetsController.allCollectibles,
    allCollectibleContracts: assetsController.allCollectibleContracts,
    ignoredCollectibles: assetsController.ignoredCollectibles,
  };

  delete migratedState.engine.backgroundState.AssetsController;

  return migratedState;
}
