import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 11)) {
    return state;
  }

  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;
  if (!isObject(preferencesControllerState)) {
    captureException(
      new Error(
        `Migration 11: Invalid PreferencesController state: '${typeof preferencesControllerState}'`,
      ),
    );
    return state;
  }

  state.engine.backgroundState.PreferencesController = {
    ...preferencesControllerState,
    useTokenDetection: true,
  };
  return state;
}
