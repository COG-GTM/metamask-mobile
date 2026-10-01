export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: { backgroundState: { PreferencesController: object } };
  };
  typedState.engine.backgroundState.PreferencesController = {
    ...typedState.engine.backgroundState.PreferencesController,
    useTokenDetection: true,
  };
  return typedState;
}
