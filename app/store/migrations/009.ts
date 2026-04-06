import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

/**
 * Set useStaticTokenList to true on PreferencesController.
 *
 * @param state - Redux state.
 * @returns Migrated Redux state.
 */
export default function migrate(state: unknown) {
  if (!isObject(state)) {
    captureException(
      new Error(`Migration 9: Invalid root state: '${typeof state}'`),
    );
    return state;
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(
        `Migration 9: Invalid engine state: '${typeof state.engine}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 9: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    return state;
  }

  if (!isObject(state.engine.backgroundState.PreferencesController)) {
    captureException(
      new Error(`Migration 9: Invalid PreferencesController state`),
    );
    return state;
  }

  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useStaticTokenList: true,
  };
  return state;
}
