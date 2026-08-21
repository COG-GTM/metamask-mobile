interface CollectiblesControllerState {
  allCollectibles?: unknown;
  allCollectibleContracts?: unknown;
  ignoredCollectibles?: unknown;
  [key: string]: unknown;
}

interface BackgroundState {
  CollectiblesController: CollectiblesControllerState;
  CollectibleDetectionController: unknown;
  NftController?: Record<string, unknown>;
  NftDetectionController?: unknown;
  PreferencesController: {
    useNftDetection?: unknown;
    useCollectibleDetection?: unknown;
  };
}

/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
 */
interface MigrationState {
  engine: {
    backgroundState: BackgroundState;
  };
}

export default function migrate(state: unknown): Record<string, unknown> {
  const backgroundState = (state as MigrationState).engine.backgroundState;
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
  delete (backgroundState as Partial<BackgroundState>).CollectiblesController;

  backgroundState.NftDetectionController =
    backgroundState.CollectibleDetectionController;
  delete (backgroundState as Partial<BackgroundState>)
    .CollectibleDetectionController;

  backgroundState.PreferencesController.useNftDetection =
    backgroundState.PreferencesController.useCollectibleDetection;
  delete backgroundState.PreferencesController.useCollectibleDetection;

  return state as Record<string, unknown>;
}
