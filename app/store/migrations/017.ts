export default function migrate(state: unknown): unknown {
  const s = state as { networkOnboarded?: { networkOnboardedState?: Record<string, unknown> }; [key: string]: unknown };
  if (s.networkOnboarded && s.networkOnboarded.networkOnboardedState) {
    s.networkOnboarded.networkOnboardedState = {};
  }
  return state;
}
