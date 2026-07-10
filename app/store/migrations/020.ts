import { v4 } from 'uuid';

interface FrequentRpc {
  chainId: number | string;
  [key: string]: unknown;
}

// Legacy persisted state shape expected by this migration
interface StateWithControllers {
  engine: {
    backgroundState: {
      PreferencesController?: {
        frequentRpcList?: FrequentRpc[];
      };
      NetworkController?: {
        networkConfigurations?: Record<string, unknown>;
      };
    };
  };
}

/**
 * Migrate network configuration from Preferences controller to Network controller.
 * See this changelog for details: https://github.com/MetaMask/core/releases/tag/v44.0.0
 *
 **/
export default function migrate(state: unknown) {
  const typedState = state as StateWithControllers;
  const preferencesControllerState =
    typedState.engine.backgroundState.PreferencesController;
  const networkControllerState =
    typedState.engine.backgroundState.NetworkController;
  const frequentRpcList = preferencesControllerState?.frequentRpcList;
  if (networkControllerState && frequentRpcList) {
    const networkConfigurations = frequentRpcList.reduce<
      Record<string, unknown>
    >((networkConfigs, networkConfig) => {
      const networkConfigurationId = v4();
      return {
        ...networkConfigs,
        [networkConfigurationId]: {
          ...networkConfig,
          // Explicitly convert number chain IDs to decimal strings
          // Likely we've only ever used string chain IDs here, but this
          // is a precaution because the type describes it as a number.
          chainId: String(networkConfig.chainId),
        },
      };
    }, {});
    delete preferencesControllerState?.frequentRpcList;

    networkControllerState.networkConfigurations = networkConfigurations ?? {};
  }
  return typedState;
}
