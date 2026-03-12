export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  if (s.engine.backgroundState.NetworkController.provider) {
    s.engine.backgroundState.NetworkController.providerConfig =
      s.engine.backgroundState.NetworkController.provider;
    delete s.engine.backgroundState.NetworkController.provider;
  }

  return s;
}
