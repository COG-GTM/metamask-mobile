type ProviderState = Record<string, unknown>;

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController: {
        provider?: ProviderState;
        providerConfig?: ProviderState;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as MigrationState;
  if (typedState.engine.backgroundState.NetworkController.provider) {
    typedState.engine.backgroundState.NetworkController.providerConfig =
      typedState.engine.backgroundState.NetworkController.provider;
    delete typedState.engine.backgroundState.NetworkController.provider;
  }

  return typedState;
}
