export default function migrate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
) {
  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useCollectibleDetection: false,
    openSeaEnabled: false,
  };
  return state;
}
