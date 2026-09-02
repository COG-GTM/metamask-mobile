import { hasProperty, isObject } from '@metamask/utils';
import { v4 } from 'uuid';

interface FrequentRpcEntry {
  chainId: string | number;
  [key: string]: unknown;
}

/**
 * Migrate network configuration from Preferences controller to Network controller.
 * See this changelog for details: https://github.com/MetaMask/core/releases/tag/v44.0.0
 *
 * @param state - Redux state
 * @returns Migrated Redux state
 */
export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !hasProperty(state, 'engine') ||
    !isObject(state.engine) ||
    !hasProperty(state.engine, 'backgroundState') ||
    !isObject(state.engine.backgroundState)
  ) {
    return state;
  }
  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;
  const networkControllerState = state.engine.backgroundState.NetworkController;
  const frequentRpcList =
    isObject(preferencesControllerState) &&
    hasProperty(preferencesControllerState, 'frequentRpcList') &&
    Array.isArray(preferencesControllerState.frequentRpcList)
      ? (preferencesControllerState.frequentRpcList as FrequentRpcEntry[])
      : undefined;
  if (
    isObject(networkControllerState) &&
    isObject(preferencesControllerState) &&
    frequentRpcList
  ) {
    const networkConfigurations = frequentRpcList.reduce<
      Record<string, FrequentRpcEntry>
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
    delete preferencesControllerState.frequentRpcList;

    networkControllerState.networkConfigurations = networkConfigurations ?? {};
  }
  return state;
}
