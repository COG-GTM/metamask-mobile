// Legacy persisted state shape expected by this migration
interface StateWithNetworkController {
  engine: {
    backgroundState: {
      NetworkController: {
        provider?: unknown;
        providerConfig?: unknown;
      };
    };
  };
}

export default function migrate(state: unknown) {
  const typedState = state as StateWithNetworkController;
  if (typedState.engine.backgroundState.NetworkController.provider) {
    typedState.engine.backgroundState.NetworkController.providerConfig =
      typedState.engine.backgroundState.NetworkController.provider;
    delete typedState.engine.backgroundState.NetworkController.provider;
  }

  return typedState;
}
