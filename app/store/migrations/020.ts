import { isObject } from '@metamask/utils';
import { v4 } from 'uuid';
import { ensureValidState } from './util';

/**
 * Migrate network configuration from Preferences controller to Network controller.
 * See this changelog for details: https://github.com/MetaMask/core/releases/tag/v44.0.0
 *
 **/
export default function migrate(state: unknown) {
  if (!ensureValidState(state, 20)) {
    return state;
  }

  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;
  const networkControllerState = state.engine.backgroundState.NetworkController;
  const frequentRpcList = isObject(preferencesControllerState)
    ? preferencesControllerState.frequentRpcList
    : undefined;
  if (
    isObject(networkControllerState) &&
    isObject(preferencesControllerState) &&
    Array.isArray(frequentRpcList)
  ) {
    const networkConfigurations = frequentRpcList.reduce<Record<string, unknown>>(
      (networkConfigs, networkConfig) => {
        const networkConfigurationId = v4();
        const config = isObject(networkConfig) ? networkConfig : {};
        const chainId = isObject(networkConfig)
          ? networkConfig.chainId
          : undefined;
        return {
          ...networkConfigs,
          [networkConfigurationId]: {
            ...config,
            // Explicitly convert number chain IDs to decimal strings
            // Likely we've only ever used string chain IDs here, but this
            // is a precaution because the type describes it as a number.
            chainId: String(chainId),
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
