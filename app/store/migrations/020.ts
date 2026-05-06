import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { v4 } from 'uuid';

interface FrequentRpcEntry {
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
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState)
  ) {
    captureException(
      new Error(`Migration 20: Invalid state structure for migration`),
    );
    return state;
  }

  const preferencesControllerState = state.engine.backgroundState
    .PreferencesController as
    | { frequentRpcList?: FrequentRpcEntry[]; [key: string]: unknown }
    | undefined;
  const networkControllerState = state.engine.backgroundState
    .NetworkController as
    | { networkConfigurations?: Record<string, unknown>; [key: string]: unknown }
    | undefined;
  const frequentRpcList = preferencesControllerState?.frequentRpcList;
  if (networkControllerState && frequentRpcList) {
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
