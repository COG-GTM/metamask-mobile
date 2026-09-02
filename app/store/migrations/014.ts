import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Migrate NetworkController provider to providerConfig.
 * @param {unknown} state - Redux state.
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
        `Migration 14: Invalid root engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 14: Invalid root engine backgroundState: '${typeof state
          .engine.backgroundState}'`,
      ),
    );
    return state;
  }
  const { backgroundState } = state.engine;
  if (!isObject(backgroundState.NetworkController)) {
    captureException(
      new Error(
        `Migration 14: Invalid NetworkController state: '${typeof backgroundState.NetworkController}'`,
      ),
    );
    return state;
  }
  const networkController = backgroundState.NetworkController;
  if (networkController.provider) {
    networkController.providerConfig = networkController.provider;
    delete networkController.provider;
  }

  return state;
}
