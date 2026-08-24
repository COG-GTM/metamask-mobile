interface Migration005BackgroundState {
  AssetsController: {
    allTokens: unknown;
    ignoredTokens: unknown;
    allCollectibles: unknown;
    allCollectibleContracts: unknown;
    ignoredCollectibles: unknown;
  };
  TokensController: Record<string, unknown>;
  CollectiblesController: Record<string, unknown>;
}

interface Migration005State {
  engine: {
    backgroundState: Migration005BackgroundState;
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration005State;
  migratedState.engine.backgroundState.TokensController = {
    allTokens: migratedState.engine.backgroundState.AssetsController.allTokens,
    ignoredTokens:
      migratedState.engine.backgroundState.AssetsController.ignoredTokens,
  };

  migratedState.engine.backgroundState.CollectiblesController = {
    allCollectibles:
      migratedState.engine.backgroundState.AssetsController.allCollectibles,
    allCollectibleContracts:
      migratedState.engine.backgroundState.AssetsController
        .allCollectibleContracts,
    ignoredCollectibles:
      migratedState.engine.backgroundState.AssetsController.ignoredCollectibles,
  };

  delete (
    migratedState.engine.backgroundState as Partial<Migration005BackgroundState>
  ).AssetsController;

  return migratedState;
}
