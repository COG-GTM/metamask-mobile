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

  if (
    !isObject(preferencesControllerState) ||
    !isObject(networkControllerState)
  ) {
    return state;
  }

  const { frequentRpcList } = preferencesControllerState;

  if (!Array.isArray(frequentRpcList)) {
    return state;
  }

  const networkConfigurations = frequentRpcList.reduce(
    (networkConfigs: Record<string, unknown>, networkConfig: unknown) => {
      if (!isObject(networkConfig)) {
        return networkConfigs;
      }
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

  return state;
}
