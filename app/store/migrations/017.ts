interface State017 {
  networkOnboarded?: { networkOnboardedState?: Record<string, unknown> };
}

export default function migrate(state: unknown): unknown {
  const typedState = state as State017;
  if (typedState.networkOnboarded?.networkOnboardedState) {
    typedState.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
