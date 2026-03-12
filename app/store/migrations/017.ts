export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  if (s.networkOnboarded && s.networkOnboarded.networkOnboardedState) {
    s.networkOnboarded.networkOnboardedState = {};
  }
  return s;
}
