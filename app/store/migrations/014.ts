/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
 */
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

export default function migrate(state: unknown): Record<string, unknown> {
  const networkControllerState = (state as MigrationState).engine
    .backgroundState.NetworkController;
  if (networkControllerState.provider) {
    networkControllerState.providerConfig = networkControllerState.provider;
    delete networkControllerState.provider;
  }

  return state as Record<string, unknown>;
}
