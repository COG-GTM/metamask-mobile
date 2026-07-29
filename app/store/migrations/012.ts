interface CollectiblesControllerState {
  allCollectibles?: unknown;
  allCollectibleContracts?: unknown;
  ignoredCollectibles?: unknown;
  [key: string]: unknown;
}

interface PreferencesControllerState {
  useNftDetection?: unknown;
  useCollectibleDetection?: unknown;
}

interface BackgroundState {
  CollectiblesController: CollectiblesControllerState;
  CollectibleDetectionController?: unknown;
  NftController?: unknown;
  NftDetectionController?: unknown;
  PreferencesController: PreferencesControllerState;
}

interface MigrationState {
  engine: {
    backgroundState: BackgroundState;
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = migrationState.engine.backgroundState.CollectiblesController;
  migrationState.engine.backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete (migrationState.engine.backgroundState as Partial<BackgroundState>)
    .CollectiblesController;

  migrationState.engine.backgroundState.NftDetectionController =
    migrationState.engine.backgroundState.CollectibleDetectionController;
  delete migrationState.engine.backgroundState.CollectibleDetectionController;

  migrationState.engine.backgroundState.PreferencesController.useNftDetection =
    migrationState.engine.backgroundState.PreferencesController.useCollectibleDetection;
  delete migrationState.engine.backgroundState.PreferencesController
    .useCollectibleDetection;

  return state;
}
