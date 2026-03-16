// @ts-nocheck
export default function migrate(state: Record<string, unknown>) {
  if (state.networkOnboarded && state.networkOnboarded.networkOnboardedState) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
