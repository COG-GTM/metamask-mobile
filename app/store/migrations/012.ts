export default function migrate(state: unknown) {
  const typedState = state as {
    engine: {
      backgroundState: Record<string, Record<string, unknown>>;
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
  delete typedState.engine.backgroundState.CollectiblesController;

  typedState.engine.backgroundState.NftDetectionController =
    typedState.engine.backgroundState.CollectibleDetectionController;
  delete typedState.engine.backgroundState.CollectibleDetectionController;

  (
    typedState.engine.backgroundState.PreferencesController as Record<
      string,
      unknown
    >
  ).useNftDetection = (
    typedState.engine.backgroundState.PreferencesController as Record<
      string,
      unknown
    >
  ).useCollectibleDetection;
  delete (
    typedState.engine.backgroundState.PreferencesController as Record<
      string,
      unknown
    >
  ).useCollectibleDetection;

  return state;
}
