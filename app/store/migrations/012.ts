/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      CollectiblesController?: {
        allCollectibles: unknown;
        allCollectibleContracts: unknown;
        ignoredCollectibles: unknown;
        [key: string]: unknown;
      };
      CollectibleDetectionController?: unknown;
      NftController?: Record<string, unknown>;
      NftDetectionController?: unknown;
      PreferencesController: {
        useCollectibleDetection?: boolean;
        useNftDetection?: boolean;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = migratedState.engine.backgroundState
    .CollectiblesController as NonNullable<
    MigrationState['engine']['backgroundState']['CollectiblesController']
  >;
  migratedState.engine.backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete migratedState.engine.backgroundState.CollectiblesController;

  migratedState.engine.backgroundState.NftDetectionController =
    migratedState.engine.backgroundState.CollectibleDetectionController;
  delete migratedState.engine.backgroundState.CollectibleDetectionController;

  migratedState.engine.backgroundState.PreferencesController.useNftDetection =
    migratedState.engine.backgroundState.PreferencesController.useCollectibleDetection;
  delete migratedState.engine.backgroundState.PreferencesController
    .useCollectibleDetection;

  return migratedState;
}
