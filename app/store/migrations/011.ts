import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Enable token detection.
 * @param {unknown} state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 11: Invalid root state: '${typeof state}'`),
    );
    return state;
  }
  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 11: Invalid root engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }
  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 11: Invalid root engine backgroundState: '${typeof state
          .engine.backgroundState}'`,
      ),
    );
    return state;
  }
  const { backgroundState } = state.engine;
  const preferencesController = isObject(backgroundState.PreferencesController)
    ? backgroundState.PreferencesController
    : {};
  state.engine.backgroundState.PreferencesController = {
    ...preferencesController,
    useTokenDetection: true,
  };
  return state;
}
