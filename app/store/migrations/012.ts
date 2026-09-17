interface CollectiblesControllerState {
  allCollectibles: unknown;
  allCollectibleContracts: unknown;
  ignoredCollectibles: unknown;
  [key: string]: unknown;
}

// Legacy persisted state shape expected by this migration
interface StateWithCollectibles {
  engine: {
    backgroundState: {
      CollectiblesController?: CollectiblesControllerState;
      NftController?: unknown;
      CollectibleDetectionController?: unknown;
      NftDetectionController?: unknown;
      PreferencesController: {
        useNftDetection?: unknown;
        useCollectibleDetection?: unknown;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as StateWithCollectibles;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = typedState.engine.backgroundState
    .CollectiblesController as CollectiblesControllerState;
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

  return typedState;
}
