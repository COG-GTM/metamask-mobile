export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  if (engineState.backgroundState.NetworkController.provider) {
    engineState.backgroundState.NetworkController.providerConfig =
      engineState.backgroundState.NetworkController.provider;
    delete engineState.backgroundState.NetworkController.provider;
  }

  return state;
}
