interface MigrationState {
  networkOnboarded?: {
    networkOnboardedState?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export default function migrate(stateUnknown: unknown) {
  const state = stateUnknown as MigrationState;
  if (state.networkOnboarded?.networkOnboardedState) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
