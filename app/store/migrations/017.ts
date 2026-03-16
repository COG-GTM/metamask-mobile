export default function migrate(state: Record<string, unknown>) {
  if (state.networkOnboarded?.networkOnboardedState) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
