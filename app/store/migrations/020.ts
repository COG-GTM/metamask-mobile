import { isObject, hasProperty } from '@metamask/utils';
import { v4 } from 'uuid';

interface FrequentRpc {
  chainId: string | number;
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
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    return state;
  }
  if (!isObject(state.engine) || !isObject(state.engine.backgroundState)) {
    return state;
  }
  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;
  const networkControllerState = state.engine.backgroundState.NetworkController;
  const frequentRpcList =
    isObject(preferencesControllerState) &&
    hasProperty(preferencesControllerState, 'frequentRpcList') &&
    Array.isArray(preferencesControllerState.frequentRpcList)
      ? (preferencesControllerState.frequentRpcList as FrequentRpc[])
      : undefined;
  if (
    isObject(networkControllerState) &&
    isObject(preferencesControllerState) &&
    frequentRpcList
  ) {
    const networkConfigurations = frequentRpcList.reduce<
      Record<string, FrequentRpc & { chainId: string }>
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
