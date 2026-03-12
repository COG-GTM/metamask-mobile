export default function migrate(state: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = state as Record<string, any>;
  s.engine.backgroundState.PreferencesController = {
    ...s.engine.backgroundState.PreferencesController,
    useTokenDetection: true,
  };
  return s;
}
