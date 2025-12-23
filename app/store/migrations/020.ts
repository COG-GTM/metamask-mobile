import { isObject, hasProperty } from '@metamask/utils';
import { v4 } from 'uuid';

interface NetworkConfig {
  chainId: string | number;
  [key: string]: unknown;
}

/**
 * Migrate network configuration from Preferences controller to Network controller.
 * See this changelog for details: https://github.com/MetaMask/core/releases/tag/v44.0.0
 *
 **/
export default function migrate(state: unknown): unknown {
  if (!isObject(state)) {
    return state;
  }

  if (!isObject(state.engine)) {
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    return state;
  }

  const preferencesControllerState = state.engine.backgroundState.PreferencesController as Record<string, unknown> | undefined;
  const networkControllerState = state.engine.backgroundState.NetworkController as Record<string, unknown> | undefined;
  const frequentRpcList = preferencesControllerState?.frequentRpcList as NetworkConfig[] | undefined;
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
    delete preferencesControllerState?.frequentRpcList;

    networkControllerState.networkConfigurations = networkConfigurations ?? {};
  }
  return state;
}
