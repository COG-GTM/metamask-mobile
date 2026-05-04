export default function migrate(state: unknown): unknown {
  const s = state as { engine: { backgroundState: { PreferencesController: Record<string, unknown> } } };
  s.engine.backgroundState.PreferencesController = {
    ...s.engine.backgroundState.PreferencesController,
    useCollectibleDetection: false,
    openSeaEnabled: false,
  };
  return state;
}
