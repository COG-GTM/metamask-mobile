import type { MigrationState } from './migration-types';

export default function migrate(stateArg: unknown): unknown {
  const state = stateArg as MigrationState;
  if (state.recents) {
    delete state.recents;
  }
  return state;
}
