interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider?: unknown;
        providerConfig?: unknown;
        [key: string]: unknown;
      };
    };
  };
  [key: string]: unknown;
}

export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  if (typedState.engine.backgroundState.NetworkController.provider) {
    typedState.engine.backgroundState.NetworkController.providerConfig =
      typedState.engine.backgroundState.NetworkController.provider;
    delete typedState.engine.backgroundState.NetworkController.provider;
  }

  return typedState as unknown as Record<string, unknown>;
}
