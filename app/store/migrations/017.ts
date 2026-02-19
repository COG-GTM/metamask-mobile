interface MigrationState {
  networkOnboarded?: {
    networkOnboardedState?: Record<string, unknown>;
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  if (s.networkOnboarded?.networkOnboardedState) {
    s.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
