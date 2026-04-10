export default function migrate(state: unknown) {
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
        TokensController: Record<string, unknown>;
        CollectiblesController: Record<string, unknown>;
      };
    };
  };

  typedState.engine.backgroundState.TokensController = {
    allTokens: typedState.engine.backgroundState.AssetsController.allTokens,
    ignoredTokens:
      typedState.engine.backgroundState.AssetsController.ignoredTokens,
  };

  typedState.engine.backgroundState.CollectiblesController = {
    allCollectibles:
      typedState.engine.backgroundState.AssetsController.allCollectibles,
    allCollectibleContracts:
      typedState.engine.backgroundState.AssetsController
        .allCollectibleContracts,
    ignoredCollectibles:
      typedState.engine.backgroundState.AssetsController.ignoredCollectibles,
  };

  delete (typedState.engine.backgroundState as Record<string, unknown>)
    .AssetsController;

  return state;
}
