interface CollectiblesControllerLegacyState {
  allCollectibles?: unknown;
  allCollectibleContracts?: unknown;
  ignoredCollectibles?: unknown;
}

interface PreferencesControllerLegacyState {
  useNftDetection?: unknown;
  useCollectibleDetection?: unknown;
}

interface Migration012State {
  engine: {
    backgroundState: {
      CollectiblesController?: CollectiblesControllerLegacyState;
      CollectibleDetectionController?: unknown;
      NftController?: unknown;
      NftDetectionController?: unknown;
      PreferencesController: PreferencesControllerLegacyState;
    };
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration012State;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = state.engine.backgroundState
    .CollectiblesController as CollectiblesControllerLegacyState;
  state.engine.backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete state.engine.backgroundState.CollectiblesController;

  state.engine.backgroundState.NftDetectionController =
    state.engine.backgroundState.CollectibleDetectionController;
  delete state.engine.backgroundState.CollectibleDetectionController;

  state.engine.backgroundState.PreferencesController.useNftDetection =
    state.engine.backgroundState.PreferencesController.useCollectibleDetection;
  delete state.engine.backgroundState.PreferencesController
    .useCollectibleDetection;

  return state;
}
