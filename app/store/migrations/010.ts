// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export default function migrate(state) {
  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useCollectibleDetection: false,
    openSeaEnabled: false,
  };
  return state;
}
