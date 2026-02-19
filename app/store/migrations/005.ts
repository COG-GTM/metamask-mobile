interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: Record<string, unknown>;
      CollectiblesController: Record<string, unknown>;
      AssetsController?: {
        allTokens: unknown;
        ignoredTokens: unknown;
        allCollectibles: unknown;
        allCollectibleContracts: unknown;
        ignoredCollectibles: unknown;
      };
      [key: string]: unknown;
    };
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  s.engine.backgroundState.TokensController = {
    allTokens: s.engine.backgroundState.AssetsController?.allTokens,
    ignoredTokens: s.engine.backgroundState.AssetsController?.ignoredTokens,
  };

  s.engine.backgroundState.CollectiblesController = {
    allCollectibles:
      s.engine.backgroundState.AssetsController?.allCollectibles,
    allCollectibleContracts:
      s.engine.backgroundState.AssetsController?.allCollectibleContracts,
    ignoredCollectibles:
      s.engine.backgroundState.AssetsController?.ignoredCollectibles,
  };

  delete s.engine.backgroundState.AssetsController;

  return state;
}
