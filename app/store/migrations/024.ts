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
export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as {
    engine: { backgroundState: { NetworkController: unknown } };
  };
  const networkControllerState =
    typedState.engine.backgroundState.NetworkController;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 24: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return state as Record<string, unknown>;
  } else if (typeof networkControllerState.network !== 'string') {
    captureException(
      new Error(
        `Migration 24: Invalid network state: '${typeof networkControllerState.network}'`,
      ),
    );
    return state as Record<string, unknown>;
  }

  const networkController = networkControllerState as Record<string, unknown>;
  if (networkController.network === 'loading') {
    networkController.networkId = null;
    networkController.networkStatus = NetworkStatus.Unknown;
  } else {
    networkController.networkId = networkController.network;
    networkController.networkStatus = NetworkStatus.Available;
  }
  delete networkController.network;

  return state as Record<string, unknown>;
}
