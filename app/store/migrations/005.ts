interface Migration5State {
  engine: {
    backgroundState: Record<string, Record<string, unknown>>;
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration5State;
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

  delete typedState.engine.backgroundState.AssetsController;

  return typedState;
}
