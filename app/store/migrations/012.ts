export default function migrate(state: unknown): unknown {
  const s = state as {
    engine: { backgroundState: Record<string, Record<string, unknown>> };
  };
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = s.engine.backgroundState.CollectiblesController;
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
