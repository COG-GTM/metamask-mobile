import { v4 } from 'uuid';

interface NetworkConfig {
  chainId: string | number;
  [key: string]: unknown;
}

interface State {
  engine: {
    backgroundState: {
      PreferencesController?: {
        frequentRpcList?: NetworkConfig[];
        [key: string]: unknown;
      };
      NetworkController?: {
        networkConfigurations?: Record<string, NetworkConfig>;
        [key: string]: unknown;
      };
    };
  };
}

/**
 * Migrate network configuration from Preferences controller to Network controller.
 * See this changelog for details: https://github.com/MetaMask/core/releases/tag/v44.0.0
 *
 * Note: the type is wrong here because it conflicts with `redux-persist`
 * types, due to a bug in that package.
 * See: https://github.com/rt2zz/redux-persist/issues/1065
 * TODO: Use `unknown` as the state type, and silence or work around the
 * redux-persist bug somehow.
 *
 **/
export default function migrate(state: State): State {
  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;
  const networkControllerState = state.engine.backgroundState.NetworkController;
  const frequentRpcList = preferencesControllerState?.frequentRpcList;
  if (networkControllerState && frequentRpcList) {
    const networkConfigurations = frequentRpcList.reduce<Record<string, NetworkConfig>>(
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
