import { isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';

export default function migrate(state: unknown) {
  if (
    !isObject(state) ||
    !isObject(state.engine) ||
    !isObject(state.engine.backgroundState) ||
    !isObject(state.engine.backgroundState.PreferencesController)
  ) {
    captureException(
      new Error(
        `Migration 9: Invalid PreferencesController state: '${typeof state}'`,
      ),
    );
    return state;
  }

  state.engine.backgroundState.PreferencesController = {
    ...state.engine.backgroundState.PreferencesController,
    useStaticTokenList: true,
  };
  return state;
}
