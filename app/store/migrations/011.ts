export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  engineState.backgroundState.PreferencesController = {
    ...engineState.backgroundState.PreferencesController,
    useTokenDetection: true,
  };
  return state;
}
