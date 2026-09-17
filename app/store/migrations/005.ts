export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        AssetsController: {
          allTokens: unknown;
          ignoredTokens: unknown;
          allCollectibles: unknown;
          allCollectibleContracts: unknown;
          ignoredCollectibles: unknown;
        };
        TokensController: unknown;
        CollectiblesController: unknown;
      };
    };
  };
  const backgroundState = typedState.engine.backgroundState;
  backgroundState.TokensController = {
    allTokens: backgroundState.AssetsController.allTokens,
    ignoredTokens: backgroundState.AssetsController.ignoredTokens,
  };

  backgroundState.CollectiblesController = {
    allCollectibles: backgroundState.AssetsController.allCollectibles,
    allCollectibleContracts:
      backgroundState.AssetsController.allCollectibleContracts,
    ignoredCollectibles: backgroundState.AssetsController.ignoredCollectibles,
  };

  delete (backgroundState as { AssetsController?: unknown }).AssetsController;

  return typedState;
}
