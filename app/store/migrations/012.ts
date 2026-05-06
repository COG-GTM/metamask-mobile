interface State012 {
  engine: {
    backgroundState: {
      CollectiblesController?: Record<string, unknown>;
      CollectibleDetectionController?: unknown;
      NftController?: Record<string, unknown>;
      NftDetectionController?: unknown;
      PreferencesController: Record<string, unknown> & {
        useCollectibleDetection?: boolean;
        useNftDetection?: boolean;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State012;
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = (typedState.engine.backgroundState.CollectiblesController ?? {}) as {
    allCollectibles?: unknown;
    allCollectibleContracts?: unknown;
    ignoredCollectibles?: unknown;
    [key: string]: unknown;
  };
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

  return state;
}
