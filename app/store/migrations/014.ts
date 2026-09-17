interface NetworkControllerState {
  provider?: unknown;
  providerConfig?: unknown;
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
  if (migrationState.engine.backgroundState.NetworkController.provider) {
    migrationState.engine.backgroundState.NetworkController.providerConfig =
      migrationState.engine.backgroundState.NetworkController.provider;
    delete migrationState.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
