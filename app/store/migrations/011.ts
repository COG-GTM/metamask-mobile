// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function migrate(state: any) {
  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useTokenDetection: true,
  };
  return state;
}
