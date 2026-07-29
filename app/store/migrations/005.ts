interface AssetsControllerState {
  allTokens: unknown;
  ignoredTokens: unknown;
  allCollectibles: unknown;
  allCollectibleContracts: unknown;
  ignoredCollectibles: unknown;
}

interface BackgroundState {
  AssetsController: AssetsControllerState;
  TokensController?: {
    allTokens: unknown;
    ignoredTokens: unknown;
  };
  CollectiblesController?: {
    allCollectibles: unknown;
    allCollectibleContracts: unknown;
    ignoredCollectibles: unknown;
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

  backgroundState.TokensController = {
    allTokens: backgroundState.AssetsController.allTokens,
    ignoredTokens: backgroundState.AssetsController.ignoredTokens,
  };

  backgroundState.CollectiblesController = {
    allCollectibles: backgroundState.AssetsController.allCollectibles,
    allCollectibleContracts:
      backgroundState.AssetsController.allCollectibleContracts,
    ignoredCollectibles: backgroundState.AssetsController.ignoredCollectibles,
  };

  delete (backgroundState as Partial<BackgroundState>).AssetsController;

  return state as Record<string, unknown>;
}
