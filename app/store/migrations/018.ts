/**
 * Subset of the persisted state read and written by this migration.
 */
interface MigrationState {
  engine: {
    backgroundState: {
      TokensController: {
        suggestedAssets?: unknown;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as MigrationState;
  if (migratedState.engine.backgroundState.TokensController.suggestedAssets) {
    delete migratedState.engine.backgroundState.TokensController
      .suggestedAssets;
  }
  return migratedState;
}
