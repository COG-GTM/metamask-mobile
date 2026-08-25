interface Migration017State {
  networkOnboarded?: {
    networkOnboardedState?: Record<string, unknown>;
  };
}

export default function migrate(incomingState: unknown) {
  const state = incomingState as Migration017State;
  if (state.networkOnboarded?.networkOnboardedState) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
