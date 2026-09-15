interface CollectiblesControllerState {
  allCollectibles: unknown;
  allCollectibleContracts: unknown;
  ignoredCollectibles: unknown;
  [key: string]: unknown;
}

interface Migration12State {
  engine: {
    backgroundState: {
      CollectiblesController: CollectiblesControllerState;
      CollectibleDetectionController: unknown;
      PreferencesController: {
        useCollectibleDetection?: unknown;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration12State;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = typedState.engine.backgroundState.CollectiblesController;
  typedState.engine.backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete typedState.engine.backgroundState.CollectiblesController;

  typedState.engine.backgroundState.NftDetectionController =
    typedState.engine.backgroundState.CollectibleDetectionController;
  delete typedState.engine.backgroundState.CollectibleDetectionController;

  typedState.engine.backgroundState.PreferencesController.useNftDetection =
    typedState.engine.backgroundState.PreferencesController.useCollectibleDetection;
  delete typedState.engine.backgroundState.PreferencesController
    .useCollectibleDetection;

  return state;
}
