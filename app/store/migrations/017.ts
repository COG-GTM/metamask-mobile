export default function migrate(state: unknown) {
  const typedState = state as {
    networkOnboarded?: {
      networkOnboardedState?: Record<string, unknown>;
    };
  };
  if (
    typedState.networkOnboarded &&
    typedState.networkOnboarded.networkOnboardedState
  ) {
    typedState.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
