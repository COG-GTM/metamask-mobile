type NetworkProperties = Record<string, unknown>;

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        properties?: NetworkProperties;
        networkDetails?: NetworkProperties;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  if (typedState.engine.backgroundState.NetworkController.properties) {
    typedState.engine.backgroundState.NetworkController.networkDetails =
      typedState.engine.backgroundState.NetworkController.properties;
    delete typedState.engine.backgroundState.NetworkController.properties;
  }
  return typedState;
}
