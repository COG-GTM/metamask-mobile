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
        `Migration 14: Invalid state structure for NetworkController migration`,
      ),
    );
    return state;
  }

  const networkController = state.engine.backgroundState
    .NetworkController as {
    provider?: unknown;
    providerConfig?: unknown;
  };
  if (networkController.provider) {
    networkController.providerConfig = networkController.provider;
    delete networkController.provider;
  }

  return state;
}
