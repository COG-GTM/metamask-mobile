interface State {
  networkOnboarded?: {
    networkOnboardedState?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

export default function migrate(state: State): State {
  if (state.networkOnboarded && state.networkOnboarded.networkOnboardedState) {
    state.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
