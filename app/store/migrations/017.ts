// Legacy persisted state shape expected by this migration
interface StateWithNetworkOnboarded {
  networkOnboarded?: {
    networkOnboardedState?: Record<string, unknown>;
  };
}

export default function migrate(state: unknown) {
  const typedState = state as StateWithNetworkOnboarded;
  if (typedState.networkOnboarded?.networkOnboardedState) {
    typedState.networkOnboarded.networkOnboardedState = {};
  }
  return typedState;
}
