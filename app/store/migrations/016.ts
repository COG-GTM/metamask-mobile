/**
 * Shape of the persisted state this migration expects. It predates the runtime
 * validation used by later migrations, so the shape is asserted rather than
 * narrowed in order to keep the original behaviour.
 */
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

export default function migrate(state: unknown): Record<string, unknown> {
  const networkControllerState = (state as MigrationState).engine
    .backgroundState.NetworkController;
  if (networkControllerState.properties) {
    networkControllerState.networkDetails = networkControllerState.properties;
    delete networkControllerState.properties;
  }
  return state as Record<string, unknown>;
}
