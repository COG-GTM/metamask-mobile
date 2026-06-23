export default function migrate(state: unknown): Record<string, unknown> {
  // Expected shape: state.engine.backgroundState holds CollectiblesController,
  // CollectibleDetectionController and PreferencesController, renamed to the
  // NFT-prefixed controllers.
  const { backgroundState } = (
    state as {
      engine: { backgroundState: Record<string, Record<string, unknown>> };
    }
  ).engine;
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
  delete backgroundState.CollectiblesController;

  backgroundState.NftDetectionController =
    backgroundState.CollectibleDetectionController;
  delete backgroundState.CollectibleDetectionController;

  backgroundState.PreferencesController.useNftDetection =
    backgroundState.PreferencesController.useCollectibleDetection;
  delete backgroundState.PreferencesController.useCollectibleDetection;

  return state as Record<string, unknown>;
}
