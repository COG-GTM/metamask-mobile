import { v4 } from 'uuid';
import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

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
    captureException(
      new Error(`Migration 20: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 20: Invalid root engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 20: Invalid root engine backgroundState: '${typeof state.engine.backgroundState}'`,
      ),
    );
    return state;
  }

  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;
  const networkControllerState = state.engine.backgroundState.NetworkController;

  if (!isObject(preferencesControllerState)) {
    return state;
  }

  const frequentRpcList = preferencesControllerState.frequentRpcList;
  if (networkControllerState && Array.isArray(frequentRpcList)) {
    const networkConfigurations = (
      frequentRpcList as Record<string, unknown>[]
    ).reduce(
      (
        networkConfigs: Record<string, Record<string, unknown>>,
        networkConfig: Record<string, unknown>,
      ) => {
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

    if (isObject(networkControllerState)) {
      networkControllerState.networkConfigurations =
        networkConfigurations ?? {};
    }
  }
  return state;
}
