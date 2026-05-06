import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.NetworkController)
  ) {
    captureException(
      new Error(
        `Migration 16: Invalid state structure for NetworkController migration`,
      ),
    );
    return state;
  }

  const networkController = state.engine.backgroundState
    .NetworkController as {
    properties?: unknown;
    networkDetails?: unknown;
  };
  if (networkController.properties) {
    networkController.networkDetails = networkController.properties;
    delete networkController.properties;
  }
  return state;
}
