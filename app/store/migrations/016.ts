import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 16: Invalid root state: '${typeof state}'`),
    );
    return state;
  }
  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 16: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 16: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState.NetworkController)) {
    captureException(
      new Error(
        `Migration 16: Invalid NetworkController state: '${typeof state.engine
          .backgroundState.NetworkController}'`,
      ),
    );
    return state;
  }

  const networkController = state.engine.backgroundState
    .NetworkController as Record<string, unknown>;
  if (networkController.properties) {
    networkController.networkDetails = networkController.properties;
    delete networkController.properties;
  }
  return state;
}
