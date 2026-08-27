/* eslint-disable @typescript-eslint/no-explicit-any */
// Legacy persisted state is expected to contain engine.backgroundState.
export default function migrate(state: unknown): Record<string, unknown>;
export default function migrate(state: any) {
  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useStaticTokenList: true,
  };
  return state;
}
