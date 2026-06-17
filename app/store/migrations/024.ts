import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { NetworkStatus } from '@metamask/network-controller';

interface MigrationState {
  engine: {
    backgroundState: {
      NetworkController?: unknown;
      [key: string]: unknown;
    };
  };
  [key: string]: unknown;
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
export default function migrate(state: unknown): Record<string, unknown> {
  const typedState = state as MigrationState;
  const networkControllerState =
    typedState.engine.backgroundState.NetworkController;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 24: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return typedState as unknown as Record<string, unknown>;
  } else if (typeof networkControllerState.network !== 'string') {
    captureException(
      new Error(
        `Migration 24: Invalid network state: '${typeof networkControllerState.network}'`,
      ),
    );
    return typedState as unknown as Record<string, unknown>;
  }

  if (networkControllerState.network === 'loading') {
    networkControllerState.networkId = null;
    networkControllerState.networkStatus = NetworkStatus.Unknown;
  } else {
    networkControllerState.networkId = networkControllerState.network;
    networkControllerState.networkStatus = NetworkStatus.Available;
  }
  delete networkControllerState.network;

  return typedState as unknown as Record<string, unknown>;
}
