// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: Record<string, any>): Record<string, any> {
  if (state.networkOnboarded && state.networkOnboarded.networkOnboardedState) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
