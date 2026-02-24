import type { MigrationState } from './migration-types';

export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
  if (state.engine.backgroundState.NetworkController.properties) {
    state.engine.backgroundState.NetworkController.networkDetails =
      state.engine.backgroundState.NetworkController.properties;
    delete state.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
