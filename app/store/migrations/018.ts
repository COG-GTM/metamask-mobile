import type { MigrationState } from './migration-types';

export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
  if (state.engine.backgroundState.TokensController.suggestedAssets) {
    delete state.engine.backgroundState.TokensController.suggestedAssets;
  }
  return state;
}
