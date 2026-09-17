export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: {
      backgroundState: {
        PreferencesController: Record<string, unknown>;
      };
    };
  };
  typedState.engine.backgroundState.PreferencesController = {
    ...typedState.engine.backgroundState.PreferencesController,
    useStaticTokenList: true,
  };
  return typedState;
}
