export default function migrate(state: unknown): unknown {
  const s = state as {
    engine: { backgroundState: Record<string, Record<string, unknown>> };
  };
  s.engine.backgroundState.TokensController = {
    allTokens: s.engine.backgroundState.AssetsController.allTokens,
    ignoredTokens: s.engine.backgroundState.AssetsController.ignoredTokens,
  };

  s.engine.backgroundState.CollectiblesController = {
    allCollectibles:
      s.engine.backgroundState.AssetsController.allCollectibles,
    allCollectibleContracts:
      s.engine.backgroundState.AssetsController.allCollectibleContracts,
    ignoredCollectibles:
      s.engine.backgroundState.AssetsController.ignoredCollectibles,
  };

  delete s.engine.backgroundState.AssetsController;

  return state;
}
