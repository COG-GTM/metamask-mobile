export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = engineState.backgroundState.CollectiblesController;
  engineState.backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete engineState.backgroundState.CollectiblesController;

  engineState.backgroundState.NftDetectionController =
    engineState.backgroundState.CollectibleDetectionController;
  delete engineState.backgroundState.CollectibleDetectionController;

  (engineState.backgroundState.PreferencesController as Record<string, unknown>).useNftDetection =
    (engineState.backgroundState.PreferencesController as Record<string, unknown>).useCollectibleDetection;
  delete (engineState.backgroundState.PreferencesController as Record<string, unknown>)
    .useCollectibleDetection;

  return state;
}
