import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { NetworkStatus } from '@metamask/network-controller';

// Legacy persisted state shape expected by this migration
interface StateWithNetworkController {
  engine: {
    backgroundState: {
      NetworkController: unknown;
    };
  };
}

interface LegacyNetworkControllerState {
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
 **/
export default function migrate(state: unknown) {
  const typedState = state as StateWithNetworkController;
  const networkControllerState = typedState.engine.backgroundState
    .NetworkController as LegacyNetworkControllerState;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 24: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return typedState;
  } else if (typeof networkControllerState.network !== 'string') {
    captureException(
      new Error(
        `Migration 24: Invalid network state: '${typeof networkControllerState.network}'`,
      ),
    );
    return typedState;
  }

  if (networkControllerState.network === 'loading') {
    networkControllerState.networkId = null;
    networkControllerState.networkStatus = NetworkStatus.Unknown;
  } else {
    networkControllerState.networkId = networkControllerState.network;
    networkControllerState.networkStatus = NetworkStatus.Available;
  }
  delete networkControllerState.network;

  return typedState;
}
