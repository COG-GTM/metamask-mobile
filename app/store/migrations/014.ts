interface Migration014NetworkController {
  provider?: unknown;
  providerConfig?: unknown;
}

interface Migration014State {
  engine: {
    backgroundState: {
      NetworkController: Migration014NetworkController;
    };
  };
}

export default function migrate(state: unknown) {
  const migratedState = state as Migration014State;
  if (migratedState.engine.backgroundState.NetworkController.provider) {
    migratedState.engine.backgroundState.NetworkController.providerConfig =
      migratedState.engine.backgroundState.NetworkController.provider;
    delete migratedState.engine.backgroundState.NetworkController.provider;
  }

  return migratedState;
}
