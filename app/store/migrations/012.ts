interface CollectiblesControllerState {
  allCollectibles?: unknown;
  allCollectibleContracts?: unknown;
  ignoredCollectibles?: unknown;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      CollectiblesController?: CollectiblesControllerState;
      NftController?: Record<string, unknown>;
      NftDetectionController?: unknown;
      CollectibleDetectionController?: unknown;
      PreferencesController: {
        useCollectibleDetection?: boolean;
        useNftDetection?: boolean;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = s.engine.backgroundState.CollectiblesController as CollectiblesControllerState;
  s.engine.backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete s.engine.backgroundState.CollectiblesController;

  s.engine.backgroundState.NftDetectionController =
    s.engine.backgroundState.CollectibleDetectionController;
  delete s.engine.backgroundState.CollectibleDetectionController;

  s.engine.backgroundState.PreferencesController.useNftDetection =
    s.engine.backgroundState.PreferencesController.useCollectibleDetection;
  delete s.engine.backgroundState.PreferencesController
    .useCollectibleDetection;

  return state;
}
