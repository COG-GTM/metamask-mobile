export default function migrate(untypedState: unknown) {
  const state = untypedState as {
    networkOnboarded?: { networkOnboardedState?: Record<string, unknown> };
  };
  if (state.networkOnboarded?.networkOnboardedState) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
