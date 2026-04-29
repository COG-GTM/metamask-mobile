export default function migrate(state: Record<string, unknown>) {
  const networkOnboarded = state.networkOnboarded as { networkOnboardedState?: Record<string, unknown> } | undefined;
  if (networkOnboarded && networkOnboarded.networkOnboardedState) {
    networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
