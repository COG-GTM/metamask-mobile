import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { NetworkStatus } from '@metamask/network-controller';

/**
 * Migrate NetworkController state, splitting old `network` property into
 * `networkId` and `networkStatus`. This is required to update to v8 of the
 * NetworkController package.
 *
 * @see {@link https://github.com/MetaMask/core/blob/main/packages/network-controller/CHANGELOG.md#800}
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
      new Error(`Migration 24: Invalid state structure`),
    );
    return state;
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 24: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return state;
  } else if (typeof networkControllerState.network !== 'string') {
    captureException(
      new Error(
        `Migration 24: Invalid network state: '${typeof networkControllerState.network}'`,
      ),
    );
    return state;
  }

  const typedNetworkControllerState = networkControllerState as {
    network?: string;
    networkId?: string | null;
    networkStatus?: NetworkStatus;
  };

  if (typedNetworkControllerState.network === 'loading') {
    typedNetworkControllerState.networkId = null;
    typedNetworkControllerState.networkStatus = NetworkStatus.Unknown;
  } else {
    typedNetworkControllerState.networkId = typedNetworkControllerState.network;
    typedNetworkControllerState.networkStatus = NetworkStatus.Available;
  }
  delete typedNetworkControllerState.network;

  return state;
}
