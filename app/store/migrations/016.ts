interface Migration016NetworkController {
  properties?: unknown;
  networkDetails?: unknown;
}

interface Migration016State {
  engine: {
    backgroundState: {
      NetworkController: Migration016NetworkController;
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration016State;
  if (migratedState.engine.backgroundState.NetworkController.properties) {
    migratedState.engine.backgroundState.NetworkController.networkDetails =
      migratedState.engine.backgroundState.NetworkController.properties;
    delete migratedState.engine.backgroundState.NetworkController.properties;
  }
  return migratedState;
}
