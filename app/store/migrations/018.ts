/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        suggestedAssets?: unknown;
      };
    };
  };
}

export default function migrate(state: unknown): Record<string, unknown> {
  const tokensControllerState = (state as MigrationState).engine.backgroundState
    .TokensController;
  if (tokensControllerState.suggestedAssets) {
    delete tokensControllerState.suggestedAssets;
  }
  return state as Record<string, unknown>;
}
