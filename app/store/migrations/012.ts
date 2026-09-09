interface MigrationState {
  engine: {
    backgroundState: {
      CollectiblesController?: Record<string, unknown>;
      CollectibleDetectionController?: unknown;
      PreferencesController: Record<string, unknown>;
      [key: string]: unknown;
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as MigrationState;
  const collectiblesController = typedState.engine.backgroundState
    .CollectiblesController as Record<string, unknown>;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = collectiblesController;
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
