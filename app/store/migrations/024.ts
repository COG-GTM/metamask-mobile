import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { NetworkStatus } from '@metamask/network-controller';

export default function migrate(state: unknown): unknown {
  const s = state as Record<string, unknown>;
  const networkControllerState = (s.engine as Record<string, unknown>)
    ?.backgroundState as Record<string, unknown>;
  const networkController = networkControllerState?.NetworkController;

  if (!isObject(networkController)) {
    captureException(
      new Error(
        `Migration 24: Invalid network controller state: '${typeof networkController}'`,
      ),
    );
    return state;
  } else if (typeof networkController.network !== 'string') {
    captureException(
      new Error(
        `Migration 24: Invalid network state: '${typeof networkController.network}'`,
      ),
    );
    return state;
  }

  if (networkController.network === 'loading') {
    networkController.networkId = null;
    networkController.networkStatus = NetworkStatus.Unknown;
  } else {
    networkController.networkId = networkController.network;
    networkController.networkStatus = NetworkStatus.Available;
  }
  delete networkController.network;

  return state;
}
