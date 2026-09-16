import { v4 } from 'uuid';

interface LegacyFrequentRpc {
  chainId: string | number;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController: {
        frequentRpcList?: LegacyFrequentRpc[];
        [key: string]: unknown;
      };
      NetworkController?: {
        networkConfigurations?: Record<string, unknown>;
        [key: string]: unknown;
      };
    };
  };
}

/**
 * Migrate network configuration from Preferences controller to Network controller.
 * See this changelog for details: https://github.com/MetaMask/core/releases/tag/v44.0.0
 *
 **/
export default function migrate(untypedState: unknown) {
  const state = untypedState as MigrationState;
  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;
  const networkControllerState = state.engine.backgroundState.NetworkController;
  const frequentRpcList = preferencesControllerState?.frequentRpcList;
  if (networkControllerState && frequentRpcList) {
    const networkConfigurations = frequentRpcList.reduce(
      (networkConfigs, networkConfig) => {
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
      },
      {},
    );
    delete preferencesControllerState.frequentRpcList;

    networkControllerState.networkConfigurations = networkConfigurations ?? {};
  }
  return state;
}
