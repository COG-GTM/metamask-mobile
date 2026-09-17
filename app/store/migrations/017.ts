interface MigrationState {
  networkOnboarded?: {
    networkOnboardedState?: Record<string, unknown>;
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  if (migrationState.networkOnboarded?.networkOnboardedState) {
    migrationState.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
