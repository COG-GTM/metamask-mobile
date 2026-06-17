import { v4 } from 'uuid';

interface NetworkConfig {
  chainId?: unknown;
  [key: string]: unknown;
}

interface PreferencesControllerState {
  frequentRpcList?: NetworkConfig[];
  [key: string]: unknown;
}

interface NetworkControllerState {
  networkConfigurations?: unknown;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController?: PreferencesControllerState;
      NetworkController?: NetworkControllerState;
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
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
export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
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
    delete (preferencesControllerState as PreferencesControllerState)
      .frequentRpcList;

    networkControllerState.networkConfigurations = networkConfigurations ?? {};
  }
  return typedState as unknown as Record<string, unknown>;
}
