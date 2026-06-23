export default function migrate(state: unknown): Record<string, unknown> {
  // Expected shape: state.engine.backgroundState.PreferencesController
  const { backgroundState } = (
    state as {
      engine: { backgroundState: Record<string, Record<string, unknown>> };
    }
  ).engine;
  backgroundState.PreferencesController = {
    ...backgroundState.PreferencesController,
    useCollectibleDetection: false,
    openSeaEnabled: false,
  };
  return state as Record<string, unknown>;
}
