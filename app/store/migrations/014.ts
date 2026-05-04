export default function migrate(state: unknown): unknown {
  const s = state as {
    engine: { backgroundState: { NetworkController: Record<string, unknown> } };
  };
  if (s.engine.backgroundState.NetworkController.provider) {
    s.engine.backgroundState.NetworkController.providerConfig =
      s.engine.backgroundState.NetworkController.provider;
    delete s.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
