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
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  if (s.engine.backgroundState.NetworkController.provider) {
    s.engine.backgroundState.NetworkController.providerConfig =
      s.engine.backgroundState.NetworkController.provider;
    delete s.engine.backgroundState.NetworkController.provider;
  }

  return state;
}
