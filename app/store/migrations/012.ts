export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        CollectiblesController: {
          allCollectibles: unknown;
          allCollectibleContracts: unknown;
          ignoredCollectibles: unknown;
        } & Record<string, unknown>;
        CollectibleDetectionController?: unknown;
        NftController?: Record<string, unknown>;
        NftDetectionController?: unknown;
        PreferencesController: Record<string, unknown> & {
          useCollectibleDetection?: unknown;
          useNftDetection?: unknown;
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
  delete (typedState.engine.backgroundState as { CollectiblesController?: unknown })
    .CollectiblesController;

  typedState.engine.backgroundState.NftDetectionController =
    typedState.engine.backgroundState.CollectibleDetectionController;
  delete (
    typedState.engine.backgroundState as { CollectibleDetectionController?: unknown }
  ).CollectibleDetectionController;

  typedState.engine.backgroundState.PreferencesController.useNftDetection =
    typedState.engine.backgroundState.PreferencesController.useCollectibleDetection;
  delete typedState.engine.backgroundState.PreferencesController
    .useCollectibleDetection;

  return state as Record<string, unknown>;
}
