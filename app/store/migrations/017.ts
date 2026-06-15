interface Migration17State {
  networkOnboarded?: {
    networkOnboardedState?: unknown;
  };
}

export default function migrate(state: unknown) {
  const typedState = state as Migration17State;
  if (typedState.networkOnboarded?.networkOnboardedState) {
    typedState.networkOnboarded.networkOnboardedState = {};
  }
  return typedState;
}
