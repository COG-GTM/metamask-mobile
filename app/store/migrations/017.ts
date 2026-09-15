interface LegacyState {
  networkOnboarded?: {
    networkOnboardedState?: Record<string, unknown>;
  };
}

export default function migrate(stateArg: unknown) {
  const state = stateArg as LegacyState;
  if (state.networkOnboarded?.networkOnboardedState) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
