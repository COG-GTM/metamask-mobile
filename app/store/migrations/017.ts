// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  if (state.networkOnboarded && state.networkOnboarded.networkOnboardedState) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
