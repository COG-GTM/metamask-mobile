interface Migration012PreferencesController {
  useCollectibleDetection?: boolean;
  useNftDetection?: boolean;
  [key: string]: unknown;
}

interface Migration012BackgroundState {
  CollectiblesController: {
    allCollectibles: unknown;
    allCollectibleContracts: unknown;
    ignoredCollectibles: unknown;
    [key: string]: unknown;
  };
  CollectibleDetectionController: unknown;
  NftController: Record<string, unknown>;
  NftDetectionController: unknown;
  PreferencesController: Migration012PreferencesController;
}

interface Migration012State {
  engine: {
    backgroundState: Migration012BackgroundState;
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration012State;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = migratedState.engine.backgroundState.CollectiblesController;
  migratedState.engine.backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete (
    migratedState.engine.backgroundState as Partial<Migration012BackgroundState>
  ).CollectiblesController;

  migratedState.engine.backgroundState.NftDetectionController =
    migratedState.engine.backgroundState.CollectibleDetectionController;
  delete (
    migratedState.engine.backgroundState as Partial<Migration012BackgroundState>
  ).CollectibleDetectionController;

  migratedState.engine.backgroundState.PreferencesController.useNftDetection =
    migratedState.engine.backgroundState.PreferencesController.useCollectibleDetection;
  delete migratedState.engine.backgroundState.PreferencesController
    .useCollectibleDetection;

  return migratedState;
}
