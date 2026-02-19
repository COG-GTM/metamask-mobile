import { v4 } from 'uuid';

interface NetworkConfig {
  chainId: string | number;
  [key: string]: unknown;
}

interface MigrationState {
  engine: {
    backgroundState: {
      PreferencesController: {
        frequentRpcList?: NetworkConfig[];
        [key: string]: unknown;
      };
      NetworkController: {
        networkConfigurations?: Record<string, unknown>;
        [key: string]: unknown;
      };
    };
  };
}

export default function migrate(state: unknown): unknown {
  const s = state as MigrationState;
  const preferencesControllerState =
    s.engine.backgroundState.PreferencesController;
  const networkControllerState = s.engine.backgroundState.NetworkController;
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
          chainId: String(networkConfig.chainId),
        },
      };
    }, {});
    delete preferencesControllerState.frequentRpcList;

    networkControllerState.networkConfigurations =
      networkConfigurations ?? {};
  }
  return state;
}
