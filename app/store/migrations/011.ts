export default function migrate(state: unknown) {
  const typedState = state as {
    engine: {
      backgroundState: {
        PreferencesController: Record<string, unknown>;
      };
    };
  };
  typedState.engine.backgroundState.PreferencesController = {
    ...typedState.engine.backgroundState.PreferencesController,
    useTokenDetection: true,
  };
  return state;
}
