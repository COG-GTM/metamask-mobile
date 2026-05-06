interface State005 {
  engine: {
    backgroundState: {
      AssetsController?: {
        allTokens?: unknown;
        ignoredTokens?: unknown;
        allCollectibles?: unknown;
        allCollectibleContracts?: unknown;
        ignoredCollectibles?: unknown;
      };
      TokensController?: unknown;
      CollectiblesController?: unknown;
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State005;
  const assets = typedState.engine.backgroundState.AssetsController;
  typedState.engine.backgroundState.TokensController = {
    allTokens: assets?.allTokens,
    ignoredTokens: assets?.ignoredTokens,
  };

  typedState.engine.backgroundState.CollectiblesController = {
    allCollectibles: assets?.allCollectibles,
    allCollectibleContracts: assets?.allCollectibleContracts,
    ignoredCollectibles: assets?.ignoredCollectibles,
  };

  delete typedState.engine.backgroundState.AssetsController;

  return state;
}
