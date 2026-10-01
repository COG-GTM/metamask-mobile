export default function migrate(state: unknown): Record<string, unknown> {
  // Expected shape: state.engine.backgroundState.AssetsController holds the
  // legacy token/collectible maps that are split into Tokens/Collectibles.
  const { backgroundState } = (
    state as {
      engine: { backgroundState: Record<string, Record<string, unknown>> };
    }
  ).engine;
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

  return state as Record<string, unknown>;
}
