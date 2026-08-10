interface CollectiblesControllerState {
  allCollectibles?: unknown;
  allCollectibleContracts?: unknown;
  ignoredCollectibles?: unknown;
  [key: string]: unknown;
}

interface PreferencesControllerState {
  useNftDetection?: unknown;
  useCollectibleDetection?: unknown;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      CollectiblesController?: CollectiblesControllerState;
      CollectibleDetectionController?: unknown;
      NftController?: Record<string, unknown>;
      NftDetectionController?: unknown;
      PreferencesController: PreferencesControllerState;
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = migratedState.engine.backgroundState
    .CollectiblesController as CollectiblesControllerState;
  migratedState.engine.backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete migratedState.engine.backgroundState.CollectiblesController;

  migratedState.engine.backgroundState.NftDetectionController =
    migratedState.engine.backgroundState.CollectibleDetectionController;
  delete migratedState.engine.backgroundState.CollectibleDetectionController;

  migratedState.engine.backgroundState.PreferencesController.useNftDetection =
    migratedState.engine.backgroundState.PreferencesController
      .useCollectibleDetection;
  delete migratedState.engine.backgroundState.PreferencesController
    .useCollectibleDetection;

  return migratedState;
}
