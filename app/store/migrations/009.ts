import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 9)) {
    return state;
  }

  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;
  if (!isObject(preferencesControllerState)) {
    captureException(
      new Error(
        `Migration 9: Invalid PreferencesController state: '${typeof preferencesControllerState}'`,
      ),
    );
    return state;
  }

  state.engine.backgroundState.PreferencesController = {
    ...preferencesControllerState,
    useStaticTokenList: true,
  };
  return state;
}
