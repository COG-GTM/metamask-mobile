export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  const assetsController = engineState.backgroundState.AssetsController as Record<string, unknown>;

  engineState.backgroundState.TokensController = {
    allTokens: assetsController.allTokens,
    ignoredTokens: assetsController.ignoredTokens,
  };

  engineState.backgroundState.CollectiblesController = {
    allCollectibles: assetsController.allCollectibles,
    allCollectibleContracts: assetsController.allCollectibleContracts,
    ignoredCollectibles: assetsController.ignoredCollectibles,
  };

  delete engineState.backgroundState.AssetsController;

  return state;
}
