export default function migrate(state: unknown): unknown {
  const s = state as {
    engine: { backgroundState: { NetworkController: Record<string, unknown> } };
  };
  if (s.engine.backgroundState.NetworkController.properties) {
    s.engine.backgroundState.NetworkController.networkDetails =
      s.engine.backgroundState.NetworkController.properties;
    delete s.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
