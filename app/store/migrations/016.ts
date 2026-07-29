interface NetworkControllerState {
  properties?: unknown;
  networkDetails?: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: NetworkControllerState;
    };
  };
}

export default function migrate(state: unknown) {
  const migrationState = state as MigrationState;
  if (migrationState.engine.backgroundState.NetworkController.properties) {
    migrationState.engine.backgroundState.NetworkController.networkDetails =
      migrationState.engine.backgroundState.NetworkController.properties;
    delete migrationState.engine.backgroundState.NetworkController.properties;
  }
  return state;
}
