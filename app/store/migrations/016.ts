export default function migrate(state: Record<string, unknown>) {
  const engineState = state.engine as Record<string, Record<string, Record<string, unknown>>>;
  if (engineState.backgroundState.NetworkController.properties) {
    engineState.backgroundState.NetworkController.networkDetails =
      engineState.backgroundState.NetworkController.properties;
    delete engineState.backgroundState.NetworkController.properties;
  }
  return state;
}
