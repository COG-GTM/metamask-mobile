interface AssetsControllerState {
  allTokens: unknown;
  ignoredTokens: unknown;
  allCollectibles: unknown;
  allCollectibleContracts: unknown;
  ignoredCollectibles: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        AssetsController: AssetsControllerState;
        TokensController?: unknown;
        CollectiblesController?: unknown;
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

  return typedState;
}
