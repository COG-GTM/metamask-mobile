interface AssetsControllerState {
  allTokens: unknown;
  ignoredTokens: unknown;
  allCollectibles: unknown;
  allCollectibleContracts: unknown;
  ignoredCollectibles: unknown;
}

interface Migration05State {
  engine: {
    backgroundState: {
      AssetsController: AssetsControllerState;
      [key: string]: unknown;
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration05State;
  typedState.engine.backgroundState.TokensController = {
    allTokens: typedState.engine.backgroundState.AssetsController.allTokens,
    ignoredTokens: typedState.engine.backgroundState.AssetsController.ignoredTokens,
  };

  state.engine.backgroundState.CollectiblesController = {
    allCollectibles:
      typedState.engine.backgroundState.AssetsController.allCollectibles,
    allCollectibleContracts:
      typedState.engine.backgroundState.AssetsController.allCollectibleContracts,
    ignoredCollectibles:
      typedState.engine.backgroundState.AssetsController.ignoredCollectibles,
  };

  delete typedState.engine.backgroundState.AssetsController;

  return state;
}
