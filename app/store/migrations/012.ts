interface LegacyCollectiblesControllerState {
  allCollectibles: unknown;
  allCollectibleContracts: unknown;
  ignoredCollectibles: unknown;
  [key: string]: unknown;
}

interface LegacyState {
  engine: {
    backgroundState: {
      CollectiblesController?: LegacyCollectiblesControllerState;
      NftController?: Record<string, unknown>;
      CollectibleDetectionController?: unknown;
      NftDetectionController?: unknown;
      PreferencesController: {
        useCollectibleDetection?: unknown;
        useNftDetection?: unknown;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = state.engine.backgroundState
    .CollectiblesController as LegacyCollectiblesControllerState;
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
