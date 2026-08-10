interface MigrationState {
  networkOnboarded?: {
    networkOnboardedState?: Record<string, unknown>;
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as MigrationState;
  if (state.networkOnboarded?.networkOnboardedState) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
