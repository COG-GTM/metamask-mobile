interface LegacyState {
  engine: {
    backgroundState: {
      AssetsController?: {
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
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  const assetsController = state.engine.backgroundState
    .AssetsController as NonNullable<
    LegacyState['engine']['backgroundState']['AssetsController']
  >;
  state.engine.backgroundState.TokensController = {
    allTokens: assetsController.allTokens,
    ignoredTokens: assetsController.ignoredTokens,
  };

  state.engine.backgroundState.CollectiblesController = {
    allCollectibles: assetsController.allCollectibles,
    allCollectibleContracts: assetsController.allCollectibleContracts,
    ignoredCollectibles: assetsController.ignoredCollectibles,
  };

  delete state.engine.backgroundState.AssetsController;

  return state;
}
