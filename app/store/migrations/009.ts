import { isObject } from '@metamask/utils';
import { ensureValidState } from './util';

export default function migrate(state: unknown) {
  if (!ensureValidState(state, 9)) {
    return state;
  }

  const preferencesControllerState =
    state.engine.backgroundState.PreferencesController;

  state.engine.backgroundState.PreferencesController = {
    ...(isObject(preferencesControllerState) ? preferencesControllerState : {}),
    useStaticTokenList: true,
  };
  return state;
}
