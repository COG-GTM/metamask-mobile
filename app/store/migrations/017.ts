interface Migration017State {
  networkOnboarded?: {
    networkOnboardedState?: Record<string, unknown>;
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration017State;
  if (migratedState.networkOnboarded?.networkOnboardedState) {
    migratedState.networkOnboarded.networkOnboardedState = {};
  }
  return migratedState;
}
