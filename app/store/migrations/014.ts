import type { MigrationState } from './migration-types';

export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
  if (state.engine.backgroundState.NetworkController.provider) {
    state.engine.backgroundState.NetworkController.providerConfig =
      state.engine.backgroundState.NetworkController.provider;
    delete state.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
