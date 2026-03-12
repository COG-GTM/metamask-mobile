export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
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

  return s;
}
