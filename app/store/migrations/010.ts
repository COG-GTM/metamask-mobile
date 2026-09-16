export default function migrate(untypedState: unknown) {
  const state = untypedState as {
    engine: { backgroundState: Record<string, Record<string, unknown>> };
  };
  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useCollectibleDetection: false,
    openSeaEnabled: false,
  };
  return state;
}
