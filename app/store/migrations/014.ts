import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Rename NetworkController.provider to NetworkController.providerConfig.
 *
 * @param state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 14: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 14: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 14: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState.NetworkController)) {
    captureException(
      new Error(`Migration 14: Invalid NetworkController state`),
    );
    return state;
  }

  const networkController = state.engine.backgroundState
    .NetworkController as Record<string, unknown>;

  if (hasProperty(networkController, 'provider')) {
    networkController.providerConfig = networkController.provider;
    delete networkController.provider;
  }

  return state;
}
