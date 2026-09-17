interface AssetsControllerState {
  allTokens: unknown;
  ignoredTokens: unknown;
  allCollectibles: unknown;
  allCollectibleContracts: unknown;
  ignoredCollectibles: unknown;
}

interface BackgroundState {
  AssetsController: AssetsControllerState;
  TokensController?: unknown;
  CollectiblesController?: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: BackgroundState;
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  migrationState.engine.backgroundState.TokensController = {
    allTokens: migrationState.engine.backgroundState.AssetsController.allTokens,
    ignoredTokens:
      migrationState.engine.backgroundState.AssetsController.ignoredTokens,
  };

  migrationState.engine.backgroundState.CollectiblesController = {
    allCollectibles:
      migrationState.engine.backgroundState.AssetsController.allCollectibles,
    allCollectibleContracts:
      migrationState.engine.backgroundState.AssetsController
        .allCollectibleContracts,
    ignoredCollectibles:
      migrationState.engine.backgroundState.AssetsController
        .ignoredCollectibles,
  };

  delete (migrationState.engine.backgroundState as Partial<BackgroundState>)
    .AssetsController;

  return state;
}
