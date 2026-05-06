import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { NetworkStatus } from '@metamask/network-controller';

interface NetworkControllerStateLike {
  network?: string;
  networkId?: string | null;
  networkStatus?: NetworkStatus;
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
export default function migrate(state: unknown): unknown {
  const typedState = state as {
    engine: { backgroundState: { NetworkController?: unknown } };
  };
  const networkControllerState =
    typedState.engine.backgroundState.NetworkController;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 24: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return state;
  }
  const ncStateCheck = networkControllerState as NetworkControllerStateLike;
  if (typeof ncStateCheck.network !== 'string') {
    captureException(
      new Error(
        `Migration 24: Invalid network state: '${typeof ncStateCheck.network}'`,
      ),
    );
    return state;
  }

  const ncState = networkControllerState as NetworkControllerStateLike;
  if (ncState.network === 'loading') {
    ncState.networkId = null;
    ncState.networkStatus = NetworkStatus.Unknown;
  } else {
    ncState.networkId = ncState.network ?? null;
    ncState.networkStatus = NetworkStatus.Available;
  }
  delete ncState.network;

  return state;
}
