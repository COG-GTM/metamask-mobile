import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { NetworkStatus } from '@metamask/network-controller';

interface Migration024State {
  engine: {
    backgroundState: Record<string, unknown>;
  };
}

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
  const migratedState = state as Migration024State;
  const networkControllerState =
    migratedState.engine.backgroundState.NetworkController;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 24: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return migratedState;
  } else if (typeof networkControllerState.network !== 'string') {
    captureException(
      new Error(
        `Migration 24: Invalid network state: '${typeof networkControllerState.network}'`,
      ),
    );
    return migratedState;
  }

  if (networkControllerState.network === 'loading') {
    networkControllerState.networkId = null;
    networkControllerState.networkStatus = NetworkStatus.Unknown;
  } else {
    networkControllerState.networkId = networkControllerState.network;
    networkControllerState.networkStatus = NetworkStatus.Available;
  }
  delete networkControllerState.network;

  return migratedState;
}
