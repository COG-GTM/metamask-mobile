interface MigrationState {
  networkOnboarded?: {
    networkOnboardedState?: unknown;
  };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as MigrationState;
  if (typedState.networkOnboarded?.networkOnboardedState) {
    typedState.networkOnboarded.networkOnboardedState = {};
  }
  return typedState;
}
