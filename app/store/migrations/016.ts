export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  if (s.engine.backgroundState.NetworkController.properties) {
    s.engine.backgroundState.NetworkController.networkDetails =
      s.engine.backgroundState.NetworkController.properties;
    delete s.engine.backgroundState.NetworkController.properties;
  }
  return s;
}
