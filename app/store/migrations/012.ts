type ControllerState = Record<string, unknown>;

interface CollectiblesControllerState extends ControllerState {
  allCollectibles: unknown;
  allCollectibleContracts: unknown;
  ignoredCollectibles: unknown;
}

interface PreferencesControllerState extends ControllerState {
  useCollectibleDetection?: unknown;
  useNftDetection?: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      CollectiblesController?: CollectiblesControllerState;
      NftController?: ControllerState;
      NftDetectionController?: unknown;
      CollectibleDetectionController?: unknown;
      PreferencesController: PreferencesControllerState;
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  const collectiblesController = typedState.engine.backgroundState
    .CollectiblesController as CollectiblesControllerState;
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
