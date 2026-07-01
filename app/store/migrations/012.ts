export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        CollectiblesController: {
          allCollectibles?: unknown;
          allCollectibleContracts?: unknown;
          ignoredCollectibles?: unknown;
          [key: string]: unknown;
        };
        NftController?: unknown;
        NftDetectionController?: unknown;
        CollectibleDetectionController?: unknown;
        PreferencesController: {
          useNftDetection?: unknown;
          useCollectibleDetection?: unknown;
          [key: string]: unknown;
        };
      };
    };
  };
  const backgroundState = typedState.engine.backgroundState;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = backgroundState.CollectiblesController;
  backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete (backgroundState as { CollectiblesController?: unknown })
    .CollectiblesController;

  backgroundState.NftDetectionController =
    backgroundState.CollectibleDetectionController;
  delete backgroundState.CollectibleDetectionController;

  backgroundState.PreferencesController.useNftDetection =
    backgroundState.PreferencesController.useCollectibleDetection;
  delete backgroundState.PreferencesController.useCollectibleDetection;

  return typedState;
}
