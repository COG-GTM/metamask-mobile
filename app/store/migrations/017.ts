export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    networkOnboarded?: { networkOnboardedState?: unknown };
  };
  if (
    typedState.networkOnboarded?.networkOnboardedState
  ) {
    typedState.networkOnboarded.networkOnboardedState = {};
  }
  return typedState;
}
