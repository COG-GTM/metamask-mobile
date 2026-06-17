interface MigrationState {
  engine: {
    backgroundState: {
      CollectiblesController: Record<string, unknown>;
      CollectibleDetectionController?: unknown;
      NftController?: unknown;
      NftDetectionController?: unknown;
      PreferencesController: {
        useNftDetection?: unknown;
        useCollectibleDetection?: unknown;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
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
  delete (typedState.engine.backgroundState as Record<string, unknown>)
    .CollectiblesController;

  typedState.engine.backgroundState.NftDetectionController =
    typedState.engine.backgroundState.CollectibleDetectionController;
  delete typedState.engine.backgroundState.CollectibleDetectionController;

  typedState.engine.backgroundState.PreferencesController.useNftDetection =
    typedState.engine.backgroundState.PreferencesController.useCollectibleDetection;
  delete typedState.engine.backgroundState.PreferencesController
    .useCollectibleDetection;

  return typedState as unknown as Record<string, unknown>;
}
