import type { MigrationState } from './migration-types';

export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
  if (state.networkOnboarded && state.networkOnboarded.networkOnboardedState) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
