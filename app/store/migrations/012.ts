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
  delete (typedState.engine.backgroundState as Record<string, unknown>)
    .CollectibleDetectionController;

  typedState.engine.backgroundState.PreferencesController.useNftDetection =
    typedState.engine.backgroundState.PreferencesController.useCollectibleDetection;
  delete typedState.engine.backgroundState.PreferencesController
    .useCollectibleDetection;

  return typedState;
}
